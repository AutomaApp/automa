import { customAlphabet } from 'nanoid/non-secure';
import browser from 'webextension-polyfill';
import compareBlockValue from '@/utils/compareBlockValue';
import testConditions from '@/utils/testConditions';
import renderString from '../templating/renderString';
import { automaRefDataStr, messageSandbox } from '../helper';

const nanoid = customAlphabet('1234567890abcdef', 5);

function checkConditions(data, conditionOptions) {
  return new Promise((resolve, reject) => {
    let retryCount = 1;
    const replacedValue = {};

    const testAllConditions = async () => {
      try {
        for (let index = 0; index < data.conditions.length; index += 1) {
          const result = await testConditions(
            data.conditions[index].conditions,
            conditionOptions
          );

          Object.assign(replacedValue, result?.replacedValue || {});

          if (result.isMatch) {
            resolve({ match: true, index, replacedValue });
            return;
          }
        }

        if (data.retryConditions && retryCount <= data.retryCount) {
          retryCount += 1;

          setTimeout(() => {
            testAllConditions();
          }, data.retryTimeout);
        } else {
          resolve({ match: false, replacedValue });
        }
      } catch (error) {
        reject(error);
      }
    };

    testAllConditions();
  });
}
async function checkCodeCondition(activeTab, payload) {
  const variableId = nanoid();

  if (!payload.data.context || payload.data.context === 'website') {
    if (!activeTab.id) throw new Error('no-tab');

    const [{ result }] = await browser.scripting.executeScript({
      world: 'MAIN',
      args: [payload, variableId, automaRefDataStr(variableId)],
      target: {
        tabId: activeTab.id,
        frameIds: [activeTab.frameId || 0],
      },
      func: ({ data, refData }, varId, refDataScript) => {
        return new Promise((resolve, reject) => {
          const varName = `automa${varId}`;

          const scriptEl = document.createElement('script');
          scriptEl.textContent = `
            (async () => {
              const ${varName} = ${JSON.stringify(refData)};
              ${refDataScript}
              try {
                ${data.code}
              } catch (error) {
                return {
                  $isError: true,
                  message: error.message,
                }
              }
            })()
              .then((detail) => {
                window.dispatchEvent(new CustomEvent('__automa-condition-code__', { detail }));
              });
          `;

          document.documentElement.appendChild(scriptEl);

          const handleAutomaEvent = ({ detail }) => {
            scriptEl.remove();
            window.removeEventListener(
              '__automa-condition-code__',
              handleAutomaEvent
            );

            if (detail.$isError) {
              reject(new Error(detail.message));
              return;
            }

            resolve(detail);
          };

          window.addEventListener(
            '__automa-condition-code__',
            handleAutomaEvent
          );
        });
      },
    });
    return result;
  }
  const result = await messageSandbox('conditionCode', payload);
  if (result && result.$isError) throw new Error(result.message);

  return result;
}

async function conditions({ data, id }, { prevBlockData, refData }) {
  if (data.conditions.length === 0) {
    throw new Error('conditions-empty');
  }

  let resultData = '';
  let isConditionMet = false;
  let outputId = 'fallback';

  const replacedValue = {};
  const condition = data.conditions[0];
  const prevData = Array.isArray(prevBlockData)
    ? prevBlockData[0]
    : prevBlockData;

  if (condition && condition.conditions) {
    const conditionPayload = {
      refData,
      checkCodeCondition: (payload) =>
        checkCodeCondition(this.activeTab, payload),
      sendMessage: (payload) =>
        this._sendMessageToTab({ ...payload.data, label: 'conditions', id }),
    };

    const conditionsResult = await checkConditions(data, conditionPayload);

    if (conditionsResult.replacedValue) {
      Object.assign(replacedValue, conditionsResult.replacedValue);
    }
    if (conditionsResult.match) {
      isConditionMet = true;
      outputId = data.conditions[conditionsResult.index].id;
    }
  } else {
    for (const { type, value, compareValue, id: itemId } of data.conditions) {
      if (isConditionMet) break;

      const firstValue = await renderString(compareValue ?? prevData, refData)
        .value;
      const secondValue = await renderString(value, refData).value;

      Object.assign(replacedValue, firstValue.list, secondValue.list);

      const isMatch = compareBlockValue(
        type,
        firstValue.value,
        secondValue.value
      );

      if (isMatch) {
        outputId = itemId;
        resultData = value;
        isConditionMet = true;
      }
    }
  }

  return {
    replacedValue,
    data: resultData,
    nextBlockId: this.getBlockConnections(id, outputId),
  };
}

export default conditions;

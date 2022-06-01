import compareBlockValue from '@/utils/compareBlockValue';
import mustacheReplacer from '@/utils/referenceData/mustacheReplacer';
import testConditions from '@/utils/testConditions';
import { getBlockConnection } from '../helper';

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

async function conditions({ data, outputs }, { prevBlockData, refData }) {
  if (data.conditions.length === 0) {
    throw new Error('conditions-empty');
  }

  let resultData = '';
  let isConditionMet = false;
  let outputIndex = data.conditions.length + 1;

  const replacedValue = {};
  const condition = data.conditions[0];
  const prevData = Array.isArray(prevBlockData)
    ? prevBlockData[0]
    : prevBlockData;

  if (condition && condition.conditions) {
    const conditionPayload = {
      refData,
      activeTab: this.activeTab.id,
      sendMessage: (payload) =>
        this._sendMessageToTab({ ...payload, isBlock: false }),
    };

    const conditionsResult = await checkConditions(data, conditionPayload);

    if (conditionsResult.replacedValue) {
      Object.assign(replacedValue, conditionsResult.replacedValue);
    }
    if (conditionsResult.match) {
      isConditionMet = true;
      outputIndex = conditionsResult.index + 1;
    }
  } else {
    data.conditions.forEach(({ type, value, compareValue }, index) => {
      if (isConditionMet) return;

      const firstValue = mustacheReplacer(
        compareValue ?? prevData,
        refData
      ).value;
      const secondValue = mustacheReplacer(value, refData).value;

      Object.assign(replacedValue, firstValue.list, secondValue.list);

      const isMatch = compareBlockValue(
        type,
        firstValue.value,
        secondValue.value
      );

      if (isMatch) {
        resultData = value;
        outputIndex = index + 1;
        isConditionMet = true;
      }
    });
  }

  return {
    replacedValue,
    data: resultData,
    nextBlockId: getBlockConnection({ outputs }, outputIndex),
  };
}

export default conditions;

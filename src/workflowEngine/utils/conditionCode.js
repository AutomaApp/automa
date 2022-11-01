import { customAlphabet } from 'nanoid/non-secure';
import browser from 'webextension-polyfill';
import { automaRefDataStr, messageSandbox, checkCSPAndInject } from '../helper';

const nanoid = customAlphabet('1234567890abcdef', 5);
const isMV2 = browser.runtime.getManifest().manifest_version === 2;

export default async function (activeTab, payload) {
  const variableId = `automa${nanoid()}`;

  if (
    !payload.data.context ||
    payload.data.context === 'website' ||
    !payload.isPopup
  ) {
    if (!activeTab.id) throw new Error('no-tab');

    const refDataScriptStr = automaRefDataStr(variableId);

    if (!isMV2) {
      const result = await checkCSPAndInject(
        {
          target: { tabId: activeTab.id },
          debugMode: payload.debugMode,
        },
        () => {
          return `
          (async () => {
            const ${variableId} = ${JSON.stringify(payload.refData)};
            ${refDataScriptStr}
            try {
              ${payload.data.code}
            } catch (error) {
              return {
                $isError: true,
                message: error.message,
              }
            }
          })();
        `;
        }
      );

      if (result.isBlocked) return result.value;
    }

    const [{ result }] = await browser.scripting.executeScript({
      world: 'MAIN',
      args: [payload, variableId, refDataScriptStr],
      target: {
        tabId: activeTab.id,
        frameIds: [activeTab.frameId || 0],
      },
      func: ({ data, refData }, varId, refDataScript) => {
        return new Promise((resolve, reject) => {
          const varName = varId;

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

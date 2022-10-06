import { customAlphabet } from 'nanoid/non-secure';
import browser from 'webextension-polyfill';
import cloneDeep from 'lodash.clonedeep';
import { automaRefDataStr, waitTabLoaded } from '../helper';

const nanoid = customAlphabet('1234567890abcdef', 5);

function getAutomaScript(refData, everyNewTab) {
  const varName = `automa${nanoid()}`;

  let str = `
const ${varName} = ${JSON.stringify(refData)};
${automaRefDataStr(varName)}
function automaSetVariable(name, value) {
  ${varName}.variables[name] = value;
}
function automaNextBlock(data, insert = true) {
  document.body.dispatchEvent(new CustomEvent('__automa-next-block__', { detail: { data, insert, refData: ${varName} } }));
}
function automaResetTimeout() {
 document.body.dispatchEvent(new CustomEvent('__automa-reset-timeout__'));
}
  `;

  if (everyNewTab) str = automaRefDataStr(varName);

  return str;
}
function executeInSandbox(data) {
  return new Promise((resolve) => {
    const messageId = nanoid();

    const iframeEl = document.querySelector('#sandbox');
    iframeEl.contentWindow.postMessage({ id: messageId, ...data }, '*');

    const messageListener = ({ data: messageData }) => {
      if (messageData?.type !== 'sandbox' || messageData?.id !== messageId)
        return;

      resolve(messageData.result);
    };

    window.addEventListener('message', messageListener, { once: true });
  });
}
async function executeInWebpage(args, target) {
  const [{ result }] = await browser.scripting.executeScript({
    args,
    target,
    world: 'MAIN',
    func: ($blockData, $preloadScripts, $automaScript) => {
      return new Promise((resolve, reject) => {
        try {
          let $documentCtx = document;

          if ($blockData.frameSelector) {
            const iframeCtx = document.querySelector(
              $blockData.frameSelector
            )?.contentDocument;

            if (!iframeCtx) {
              reject(new Error('iframe-not-found'));
              return;
            }

            $documentCtx = iframeCtx;
          }

          const scriptAttr = `block--${$blockData.id}`;

          const isScriptExists = $documentCtx.querySelector(
            `.automa-custom-js[${scriptAttr}]`
          );
          if (isScriptExists) {
            resolve('');
            return;
          }

          const script = document.createElement('script');
          script.setAttribute(scriptAttr, '');
          script.classList.add('automa-custom-js');
          script.textContent = `(() => {
            ${$automaScript}

            try {
              ${$blockData.data.code}
              ${
                $blockData.data.everyNewTab ||
                $blockData.data.code.includes('automaNextBlock')
                  ? ''
                  : 'automaNextBlock()'
              }
            } catch (error) {
              console.error(error);
              ${
                $blockData.data.everyNewTab
                  ? ''
                  : 'automaNextBlock({ $error: true, message: error.message })'
              }
            }
          })()`;

          const preloadScriptsEl = $preloadScripts.map((item) => {
            const scriptEl = document.createElement('script');
            scriptEl.id = item.id;
            scriptEl.textContent = item.script;

            $documentCtx.head.appendChild(scriptEl);

            return { element: scriptEl, removeAfterExec: item.removeAfterExec };
          });

          if (!$blockData.data.everyNewTab) {
            let timeout;
            let onNextBlock;
            let onResetTimeout;

            /* eslint-disable-next-line */
            function cleanUp() {
              script.remove();
              preloadScriptsEl.forEach((item) => {
                if (item.removeAfterExec) item.script.remove();
              });

              clearTimeout(timeout);

              $documentCtx.body.removeEventListener(
                '__automa-reset-timeout__',
                onResetTimeout
              );
              $documentCtx.body.removeEventListener(
                '__automa-next-block__',
                onNextBlock
              );
            }

            onNextBlock = ({ detail }) => {
              cleanUp(detail || {});
              resolve({
                columns: {
                  data: detail?.data,
                  insert: detail?.insert,
                },
                variables: detail?.refData?.variables,
              });
            };
            onResetTimeout = () => {
              clearTimeout(timeout);
              timeout = setTimeout(cleanUp, $blockData.data.timeout);
            };

            $documentCtx.body.addEventListener(
              '__automa-next-block__',
              onNextBlock
            );
            $documentCtx.body.addEventListener(
              '__automa-reset-timeout__',
              onResetTimeout
            );

            timeout = setTimeout(cleanUp, $blockData.data.timeout);
          } else {
            resolve();
          }

          $documentCtx.head.appendChild(script);
        } catch (error) {
          console.error(error);
        }
      });
    },
  });

  return result;
}

export async function javascriptCode({ outputs, data, ...block }, { refData }) {
  const nextBlockId = this.getBlockConnections(block.id);

  if (data.everyNewTab) {
    const isScriptExist = this.preloadScripts.some(({ id }) => id === block.id);
    if (!isScriptExist) this.preloadScripts.push({ ...block, data });
    if (!this.activeTab.id) return { data: '', nextBlockId };
  } else if (!this.activeTab.id && data.context !== 'background') {
    throw new Error('no-tab');
  }

  const payload = {
    ...block,
    data,
    refData: { variables: {} },
    frameSelector: this.frameSelector,
  };
  if (data.code.includes('automaRefData')) {
    payload.refData = { ...refData, secrets: {} };
  }

  const preloadScriptsPromise = await Promise.allSettled(
    data.preloadScripts.map(async (script) => {
      const { protocol } = new URL(script.src);
      const isValidUrl = /https?/.test(protocol);
      if (!isValidUrl) return null;

      const response = await fetch(script.src);
      if (!response.ok) throw new Error(response.statusText);

      const result = await response.text();

      return {
        script: result,
        id: `automa-script-${nanoid()}`,
        removeAfterExec: script.removeAfterExec,
      };
    })
  );
  const preloadScripts = preloadScriptsPromise.reduce((acc, item) => {
    if (item.status === 'fulfilled') acc.push(item.value);

    return acc;
  }, []);

  const automaScript =
    data.everyNewTab || data.context === 'background'
      ? ''
      : getAutomaScript(payload.refData, data.everyNewTab);

  if (data.context !== 'background') {
    await waitTabLoaded({
      tabId: this.activeTab.id,
      ms: this.settings?.tabLoadTimeout ?? 30000,
    });
  }

  const result = await (data.context === 'background'
    ? executeInSandbox({
        preloadScripts,
        refData: payload.refData,
        blockData: cloneDeep(payload.data),
      })
    : executeInWebpage([payload, preloadScripts, automaScript], {
        tabId: this.activeTab.id,
        frameIds: [this.activeTab.frameId || 0],
      }));

  if (result) {
    if (result.columns.data?.$error) {
      throw new Error(result.columns.data.message);
    }

    if (result.variables) {
      Object.keys(result.variables).forEach((varName) => {
        this.setVariable(varName, result.variables[varName]);
      });
    }

    if (result.columns.insert && result.columns.data) {
      const params = Array.isArray(result.columns.data)
        ? result.columns.data
        : [result.columns.data];

      this.addDataToColumn(params);
    }
  }

  return {
    nextBlockId,
    data: result?.columns.data || {},
  };
}

export default javascriptCode;

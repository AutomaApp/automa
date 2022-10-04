import { customAlphabet } from 'nanoid/non-secure';
import browser from 'webextension-polyfill';
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

export async function javascriptCode({ outputs, data, ...block }, { refData }) {
  const nextBlockId = this.getBlockConnections(block.id);

  if (data.everyNewTab) {
    const isScriptExist = this.preloadScripts.some(({ id }) => id === block.id);
    if (!isScriptExist) this.preloadScripts.push({ ...block, data });
    if (!this.activeTab.id) return { data: '', nextBlockId };
  } else if (!this.activeTab.id) {
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

  const automaScript = data.everyNewTab
    ? ''
    : getAutomaScript(payload.refData, data.everyNewTab);

  await waitTabLoaded({
    tabId: this.activeTab.id,
    ms: this.settings?.tabLoadTimeout ?? 30000,
  });

  const [{ result }] = await browser.scripting.executeScript({
    world: 'MAIN',
    args: [payload, preloadScripts, automaScript],
    target: {
      tabId: this.activeTab.id,
      frameIds: [this.activeTab.frameId || 0],
    },
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
            function cleanUp(detail) {
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

              resolve({
                columns: {
                  data: detail?.data,
                  insert: detail?.insert,
                },
                variables: detail?.refData?.variables,
              });
            }

            onNextBlock = ({ detail }) => {
              cleanUp(detail || {});
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

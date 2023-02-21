import { customAlphabet } from 'nanoid/non-secure';
import { messageSandbox } from '../helper';

const nanoid = customAlphabet('1234567890abcdef', 5);

export function automaFetchClient(id, { type, resource }) {
  return new Promise((resolve, reject) => {
    const validType = ['text', 'json', 'base64'];
    if (!type || !validType.includes(type)) {
      reject(new Error('The "type" must be "text" or "json"'));
      return;
    }

    const eventName = `__automa-fetch-response-${id}__`;
    const eventListener = ({ detail }) => {
      if (detail.id !== id) return;

      window.removeEventListener(eventName, eventListener);

      if (detail.isError) {
        reject(new Error(detail.result));
      } else {
        resolve(detail.result);
      }
    };

    window.addEventListener(eventName, eventListener);
    window.dispatchEvent(
      new CustomEvent(`__automa-fetch__`, {
        detail: {
          id,
          type,
          resource,
        },
      })
    );
  });
}

export function jsContentHandlerEval({
  blockData,
  automaScript,
  preloadScripts,
}) {
  const preloadScriptsStr = preloadScripts
    .map(({ script }) => script)
    .join('\n');

  return `(() => {
    ${preloadScriptsStr}

    return new Promise(($automaResolve) => {
      const $automaTimeoutMs = ${blockData.data.timeout};
      let $automaTimeout = setTimeout(() => {
        $automaResolve();
      }, $automaTimeoutMs);

      ${automaScript}

      ${blockData.data.code}

      ${
        blockData.data.code.includes('automaNextBlock')
          ? ''
          : 'automaNextBlock()'
      }
    }).catch((error) => {
      return { columns: { data: { $error: true, message: error.message } } }
    });
  })();`;
}

export function jsContentHandler($blockData, $preloadScripts, $automaScript) {
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
            if (item.removeAfterExec) item.element.remove();
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
              insert: detail?.insert,
              data: JSON.stringify(detail?.data ?? {}),
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
}

// 执行自定义的工作流状态事件监听JavaScriptCode
export function execStatusListenerCallback({
  status,
  variables,
  globalData,
  logsTxt,
  blockErrorMessage,
  statusListenerCallbackCode,
}) {
  const instanceId = `automa${nanoid()}`;

  // 发送消息给后台进行执行
  return messageSandbox('javascriptBlock', {
    instanceId,
    preloadScripts: [],
    refData: {
      variables,
      globalData,
      workflowStatueData: {
        workflowStatus: status,
        logsTxt,
        blockErrorMessage,
        activeTabUrl: '',
      },
    },
    blockData: {
      code: statusListenerCallbackCode,
      context: 'background',
      description: 'Workflow Status Listening Code',
      disableBlock: false,
      everyNewTab: false,
      preloadScripts: [],
      runBeforeLoad: false,
      timeout: 20000,
    },
  });
}

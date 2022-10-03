import browser from 'webextension-polyfill';
import findSelector from '@/lib/findSelector';
import { toCamelCase } from '@/utils/helper';
import { nanoid } from 'nanoid';
import automa from '@business';
import handleSelector from './handleSelector';
import blocksHandler from './blocksHandler';
import showExecutedBlock from './showExecutedBlock';
import shortcutListener from './services/shortcutListener';
import initCommandPalette from './commandPalette';
// import elementObserver from './elementObserver';
import { elementSelectorInstance } from './utils';

const isMainFrame = window.self === window.top;

function messageToFrame(frameElement, blockData) {
  return new Promise((resolve, reject) => {
    function onMessage({ data }) {
      if (data.type !== 'automa:block-execute-result') return;

      if (data.result?.$isError) {
        const error = new Error(data.result.message);
        error.data = data.result.data;

        reject(error);
      } else {
        resolve(data.result);
      }

      window.removeEventListener('message', onMessage);
    }
    window.addEventListener('message', onMessage);

    frameElement.contentWindow.postMessage(
      {
        type: 'automa:execute-block',
        blockData: { ...blockData, frameSelector: '' },
      },
      '*'
    );
  });
}
async function executeBlock(data) {
  const removeExecutedBlock = showExecutedBlock(data, data.executedBlockOnWeb);

  if (data.data?.selector?.includes('|>') && isMainFrame) {
    const [frameSelector, selector] = data.data.selector.split(/\|>(.+)/);
    const frameElement = document.querySelector(frameSelector);
    const frameError = (message) => {
      const error = new Error(message);
      error.data = { selector: frameSelector };

      return error;
    };

    if (!frameElement) throw frameError('iframe-not-found');

    const isFrameEelement = ['IFRAME', 'FRAME'].includes(frameElement.tagName);
    if (!isFrameEelement) throw frameError('not-iframe');

    data.data.selector = selector;
    data.data.$frameSelector = frameSelector;

    if (frameElement.contentDocument) {
      data.frameSelector = frameSelector;
    } else {
      const result = await messageToFrame(frameElement, data);
      return result;
    }
  }
  const handlers = blocksHandler();
  const handler = handlers[toCamelCase(data.name || data.label)];
  if (handler) {
    const result = await handler(data, { handleSelector });
    removeExecutedBlock();

    return result;
  }

  const error = new Error(`"${data.label}" doesn't have a handler`);
  console.error(error);

  throw error;
}
function messageListener({ data, source }) {
  if (data.type === 'automa:get-frame' && isMainFrame) {
    let frameRect = { x: 0, y: 0 };

    document.querySelectorAll('iframe').forEach((iframe) => {
      if (iframe.contentWindow !== source) return;

      frameRect = iframe.getBoundingClientRect();
    });

    source.postMessage(
      {
        frameRect,
        type: 'automa:the-frame-rect',
      },
      '*'
    );

    return;
  }

  if (data.type === 'automa:execute-block') {
    executeBlock(data.blockData)
      .then((result) => {
        window.top.postMessage(
          {
            result,
            type: 'automa:block-execute-result',
          },
          '*'
        );
      })
      .catch((error) => {
        console.error(error);
        window.top.postMessage(
          {
            result: {
              $isError: true,
              message: error.message,
              data: error.data || {},
            },
            type: 'automa:block-execute-result',
          },
          '*'
        );
      });
  }
}

(() => {
  if (window.isAutomaInjected) return;

  initCommandPalette();

  let contextElement = null;
  let $ctxTextSelection = '';

  window.isAutomaInjected = true;
  window.addEventListener('message', messageListener);
  window.addEventListener('contextmenu', ({ target }) => {
    contextElement = target;
    $ctxTextSelection = window.getSelection().toString();
  });

  if (isMainFrame) {
    shortcutListener();
    // window.addEventListener('load', elementObserver);
  }

  automa('content');

  browser.runtime.onMessage.addListener((data) => {
    return new Promise((resolve, reject) => {
      if (data.isBlock) {
        executeBlock(data)
          .then(resolve)
          .catch((error) => {
            const elNotFound = error.message === 'element-not-found';
            const isLoopItem = data.data?.selector?.includes('automa-loop');
            if (elNotFound && isLoopItem) {
              const findLoopEl = data.loopEls.find(({ url }) =>
                window.location.href.includes(url)
              );

              const blockData = { ...data.data, ...findLoopEl, multiple: true };
              const loopBlock = {
                ...data,
                onlyGenerate: true,
                data: blockData,
              };

              blocksHandler()
                .loopData(loopBlock)
                .then(() => {
                  executeBlock(data).then(resolve).catch(reject);
                })
                .catch((blockError) => {
                  reject(blockError);
                });
              return;
            }

            reject(error);
          });
      } else {
        switch (data.type) {
          case 'content-script-exists':
            resolve(true);
            break;
          case 'automa-element-selector': {
            const selectorInstance = elementSelectorInstance();

            resolve(selectorInstance);
            break;
          }
          case 'context-element': {
            let $ctxLink = '';
            let $ctxMediaUrl = '';
            let $ctxElSelector = '';

            if (contextElement) {
              $ctxElSelector = findSelector(contextElement);

              const tag = contextElement.tagName;
              if (tag === 'A') {
                $ctxLink = contextElement.href;
              }

              const mediaTags = ['AUDIO', 'VIDEO', 'IMG'];
              if (mediaTags.includes(tag)) {
                let mediaSrc = contextElement.src || '';

                if (!mediaSrc.src) {
                  const sourceEl = contextElement.querySelector('source');
                  if (sourceEl) mediaSrc = sourceEl.src;
                }

                $ctxMediaUrl = mediaSrc;
              }

              contextElement = null;
            }
            if (!$ctxTextSelection) {
              $ctxTextSelection = window.getSelection().toString();
            }

            resolve({
              $ctxElSelector,
              $ctxTextSelection,
              $ctxLink,
              $ctxMediaUrl,
            });
            break;
          }
          default:
            resolve(null);
        }
      }
    });
  });
})();

// Auto install only works on Chrome
async function autoInstall() {
  const link = window.location.href;
  if (/.+\.automa\.json$/.test(link)) {
    const accept = window.confirm(
      'Do you want to add this workflow into Automa?'
    );
    if (!accept) return;
    const workflow = JSON.parse(document.body.innerText);

    const { workflows: workflowsStorage } = await browser.storage.local.get(
      'workflows'
    );

    const workflowId = nanoid();
    const workflowData = {
      ...workflow,
      id: workflowId,
      dataColumns: [],
      createdAt: Date.now(),
      table: workflow.table || workflow.dataColumns,
    };

    if (Array.isArray(workflowsStorage)) {
      workflowsStorage.push(workflowData);
    } else {
      workflowsStorage[workflowId] = workflowData;
    }

    await browser.storage.local.set({ workflows: workflowsStorage });

    alert('Workflow installed');
  }
}
autoInstall();

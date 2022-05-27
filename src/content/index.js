import browser from 'webextension-polyfill';
import { toCamelCase } from '@/utils/helper';
import blocksHandler from './blocksHandler';
import showExecutedBlock from './showExecutedBlock';
import handleTestCondition from './handleTestCondition';
import shortcutListener from './services/shortcutListener';

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

  const handler = blocksHandler[toCamelCase(data.name)];

  if (handler) {
    const result = await handler(data);
    removeExecutedBlock();

    return result;
  }

  const error = new Error(`"${data.name}" doesn't have a handler`);
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

  window.isAutomaInjected = true;
  window.addEventListener('message', messageListener);

  if (isMainFrame) shortcutListener();

  browser.runtime.onMessage.addListener((data) => {
    return new Promise((resolve, reject) => {
      if (data.isBlock) {
        executeBlock(data).then(resolve).catch(reject);
        return;
      }

      switch (data.type) {
        case 'condition-builder':
          handleTestCondition(data.data)
            .then((result) => resolve(result))
            .catch((error) => reject(error));
          break;
        case 'content-script-exists':
          resolve(true);
          break;
        default:
      }
    });
  });
})();

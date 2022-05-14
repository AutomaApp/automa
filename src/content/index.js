import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';
import { toCamelCase } from '@/utils/helper';
import FindElement from '@/utils/FindElement';
import { getDocumentCtx } from './handleSelector';
import executedBlock from './executedBlock';
import blocksHandler from './blocksHandler';
import handleTestCondition from './handleTestCondition';

function messageListener({ data, source }) {
  if (data !== 'automa:get-frame') return;

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
}

(() => {
  if (window.isAutomaInjected) return;
  window.isAutomaInjected = true;

  if (window.self === window.top) {
    window.addEventListener('message', messageListener);
  }

  browser.runtime.onMessage.addListener((data) => {
    return new Promise((resolve, reject) => {
      if (data.isBlock) {
        const removeExecutedBlock = executedBlock(
          data,
          data.executedBlockOnWeb
        );

        const handler = blocksHandler[toCamelCase(data.name)];

        if (handler) {
          handler(data)
            .then((result) => {
              removeExecutedBlock();
              resolve(result);
            })
            .catch(reject);

          return;
        }
        console.error(`"${data.name}" doesn't have a handler`);

        resolve('');
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
        case 'loop-elements': {
          const selectors = [];
          const attrId = nanoid(5);

          const documentCtx = getDocumentCtx(data.frameSelector);
          const selectorType = data.selector.startsWith('/')
            ? 'xpath'
            : 'cssSelector';
          const elements = FindElement[selectorType](
            { selector: data.selector, multiple: true },
            documentCtx
          );

          if (!elements || elements?.length === 0) {
            reject(new Error('element-not-found'));

            return;
          }

          elements.forEach((el, index) => {
            if (data.max > 0 && selectors.length - 1 > data.max) return;

            const attrName = 'automa-loop';
            const attrValue = `${attrId}--${index}`;

            el.setAttribute(attrName, attrValue);
            selectors.push(`[${attrName}="${attrValue}"]`);
          });

          resolve(selectors);
          break;
        }
        default:
      }
    });
  });
})();

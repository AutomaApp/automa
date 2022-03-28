import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';
import { toCamelCase } from '@/utils/helper';
import executedBlock from './executed-block';
import blocksHandler from './blocks-handler';

const elementActions = {
  text: (element) => element.innerText,
  visible: (element) => {
    const { visibility, display } = getComputedStyle(element);

    return visibility !== 'hidden' || display !== 'none';
  },
  invisible: (element) => !elementActions.visible(element),
  attribute: (element, { attrName }) => {
    if (!element.hasAttribute(attrName)) return null;

    return element.getAttribute(attrName);
  },
};
function handleConditionBuilder({ data, type }) {
  if (!type.startsWith('element')) return null;

  const element = document.querySelector(data.selector);
  const { 1: actionType } = type.split('#');

  if (!element) {
    if (actionType === 'visible' || actionType === 'invisible') return false;

    return null;
  }

  return elementActions[actionType](element, data);
}

(() => {
  if (window.isAutomaInjected) return;

  window.isAutomaInjected = true;

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
          resolve(handleConditionBuilder(data.data));
          break;
        case 'content-script-exists':
          resolve(true);
          break;
        case 'give-me-the-frame-id':
          browser.runtime.sendMessage({
            type: 'this-is-the-frame-id',
          });
          resolve();
          break;
        case 'loop-elements': {
          const selectors = [];
          const attrId = nanoid(5);
          const elements = document.body.querySelectorAll(data.selector);

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

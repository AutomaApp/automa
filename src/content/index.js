import browser from 'webextension-polyfill';
import { toCamelCase } from '@/utils/helper';
import elementSelector from './element-selector';
import * as blocksHandler from './blocks-handler';

(() => {
  browser.runtime.onMessage.addListener((data) => {
    if (data.isBlock) {
      const handler = blocksHandler[toCamelCase(data.name)];

      if (handler) {
        return handler(data);
      }
      console.error(`"${data.name}" doesn't have a handler`);

      return Promise.resolve('');
    }

    return new Promise((resolve) => {
      if (data.type === 'content-script-exists') {
        resolve(true);
      } else if (data.type === 'select-element') {
        elementSelector();
        resolve(true);
      } else if (data.type === 'give-me-the-frame-id') {
        browser.runtime.sendMessage({
          type: 'this-is-the-frame-id',
        });
      }
    });
  });
})();

import browser from 'webextension-polyfill';
import { toCamelCase } from '@/utils/helper';
import elementSelector from './element-selector';
import executedBlock from './executed-block';
import blocksHandler from './blocks-handler';

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

      if (data.type === 'content-script-exists') {
        resolve(true);
      } else if (data.type === 'select-element') {
        elementSelector();
        resolve(true);
      } else if (data.type === 'give-me-the-frame-id') {
        browser.runtime.sendMessage({
          type: 'this-is-the-frame-id',
        });

        resolve();
      }
    });
  });
})();

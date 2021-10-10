import browser from 'webextension-polyfill';
import { toCamelCase } from '@/utils/helper';
import * as blocksHandler from './blocks-handler';

browser.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((data) => {
    const handler = blocksHandler[toCamelCase(data.name)];
    console.log(`${data.name}(${toCamelCase(data.name)}):`, data);
    if (handler) {
      handler(data, port);
    } else {
      console.error(`"${data.name}" doesn't have a handler`);
    }
  });
});

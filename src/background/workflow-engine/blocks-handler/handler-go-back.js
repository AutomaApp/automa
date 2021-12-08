import browser from 'webextension-polyfill';
import { getBlockConnection } from '../helper';

export function goBack(block) {
  return new Promise((resolve, reject) => {
    const nextBlockId = getBlockConnection(block);

    if (!this.tabId) {
      const error = new Error('no-tab');
      error.nextBlockId = nextBlockId;

      reject(error);

      return;
    }

    browser.tabs
      .goBack(this.tabId)
      .then(() => {
        resolve({
          nextBlockId,
          data: '',
        });
      })
      .catch((error) => {
        error.nextBlockId = nextBlockId;
        reject(error);
      });
  });
}

export default goBack;

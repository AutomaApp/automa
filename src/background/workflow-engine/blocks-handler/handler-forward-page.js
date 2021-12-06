import browser from 'webextension-polyfill';
import { getBlockConnection } from '../helper';

function forwardPage(block) {
  return new Promise((resolve, reject) => {
    const nextBlockId = getBlockConnection(block);

    if (!this.tabId) {
      const error = new Error('no-tab');
      error.nextBlockId = nextBlockId;

      reject(nextBlockId);

      return;
    }

    browser.tabs
      .goForward(this.tabId)
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

export default forwardPage;

import browser from 'webextension-polyfill';
import { getBlockConnection } from '../helper';

function forwardPage(block) {
  return new Promise((resolve, reject) => {
    const nextBlockId = getBlockConnection(block);

    if (!this.activeTab.id) {
      const error = new Error('no-tab');
      error.nextBlockId = nextBlockId;

      reject(nextBlockId);

      return;
    }

    browser.tabs
      .goForward(this.activeTab.id)
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

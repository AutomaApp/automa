/* eslint-disable no-underscore-dangle */
import browser from 'webextension-polyfill';

function getBlockConnection(block, index = 1) {
  const blockId = block.outputs[`output_${index}`].connections[0]?.node;

  return blockId;
}

export function trigger(block) {
  return new Promise((resolve) => {
    const nextBlockId = getBlockConnection(block);

    resolve({ nextBlockId, data: '' });
  });
}

export function openWebsite(block) {
  return new Promise((resolve, reject) => {
    browser.tabs
      .create({
        active: true,
        url: block.data.url,
      })
      .then((tab) => {
        this._listener({
          name: 'tab-updated',
          id: tab.id,
          once: true,
          callback: async (tabId, changeInfo, deleteListener) => {
            if (changeInfo.status !== 'complete') return;
            console.log(changeInfo.status !== 'complete', 'clll');
            try {
              await browser.tabs.executeScript(tabId, {
                file: './contentScript.bundle.js',
              });

              this.tabId = tabId;
              this._connectTab(tabId);

              deleteListener();

              resolve({
                nextBlockId: getBlockConnection(block),
                data: block.data.url,
              });
            } catch (error) {
              console.error(error);
            }
          },
        });
      })
      .catch((error) => {
        console.error(error, 'nnnaa');
        reject(error);
      });
  });
}

export function interactionHandler(block) {
  return new Promise((resolve) => {
    if (!this._connectedTab) return;

    this._connectedTab.postMessage(block);
    this._listener({
      name: 'tab-message',
      id: block.name,
      once: true,
      callback: (data) => {
        this.data.push(data);
        resolve({
          data,
          nextBlockId: getBlockConnection(block),
        });
      },
    });
  });
}

export function delay(block) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        nextBlockId: getBlockConnection(block),
        data: '',
      });
    }, block.data.time);
  });
}

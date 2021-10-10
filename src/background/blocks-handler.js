/* eslint-disable no-underscore-dangle */
import browser from 'webextension-polyfill';

function getBlockConnection(block, index = 1) {
  const blockId = block.outputs[`output_${index}`].connections[0]?.node;

  return blockId;
}

export function trigger(block) {
  return new Promise((resolve) => {
    const nextBlockId = getBlockConnection(block);

    resolve({ nextBlockId });
  });
}

export function openWebsite(block) {
  return new Promise((resolve) => {
    browser.tabs
      .create({
        active: true,
        url: block.data.url,
      })
      .then((tab) => {
        const tabListener = (tabId, changeInfo) => {
          if (changeInfo.status === 'complete' && tabId === tab.id) {
            browser.tabs.onUpdated.removeListener(tabListener);

            browser.tabs
              .executeScript(tabId, {
                file: './contentScript.bundle.js',
              })
              .then(() => {
                this._connectTab(tabId);

                resolve({ nextBlockId: getBlockConnection(block) });
              });
          }
        };

        browser.tabs.onUpdated.addListener(tabListener);
      })
      .catch((error) => {
        console.error(error, 'nnnaa');
        reject(error);
      });
  });
}

export function eventClick(block) {
  return new Promise(() => {
    if (!this._connectedTab) return;
    console.log(this._connectedTab);
    /* listen tab message and then resolve */
    this._connectedTab.postMessage(block);
  });
}

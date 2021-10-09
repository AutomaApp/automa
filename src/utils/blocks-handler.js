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
                this.connectedTab = browser.tabs.connect(tabId, {
                  name: `${this.workflow.id}--${this.workflow.name.slice(
                    0,
                    10
                  )}`,
                });
                this.tabId = tabId;

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

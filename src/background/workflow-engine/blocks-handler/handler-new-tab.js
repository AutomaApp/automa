import browser from 'webextension-polyfill';
import { getBlockConnection } from '../helper';
import executeContentScript from '../execute-content-script';

function tabUpdatedListener(tab) {
  return new Promise((resolve) => {
    this._listener({
      name: 'tab-updated',
      id: tab.id,
      callback: async (tabId, changeInfo, deleteListener) => {
        if (changeInfo.status !== 'complete') return;

        const frames = await executeContentScript(tabId, 'newtab');

        deleteListener();

        resolve(frames);
      },
    });
  });
}

async function newTab(block) {
  if (this.windowId) {
    try {
      await browser.windows.get(this.windowId);
    } catch (error) {
      this.windowId = null;
    }
  }

  try {
    const { updatePrevTab, url, active, inGroup } = block.data;

    if (updatePrevTab && this.tabId) {
      await browser.tabs.update(this.tabId, { url, active });
    } else {
      const tab = await browser.tabs.create({
        url,
        active,
        windowId: this.windowId,
      });

      this.tabId = tab.id;
      this.activeTabUrl = url;
      this.windowId = tab.windowId;
    }

    if (inGroup && !updatePrevTab) {
      const options = {
        groupId: this.tabGroupId,
        tabIds: this.tabId,
      };

      if (!this.tabGroupId) {
        options.createProperties = {
          windowId: this.windowId,
        };
      }

      chrome.tabs.group(options, (tabGroupId) => {
        this.tabGroupId = tabGroupId;
      });
    }

    this.frameId = 0;
    this.frames = await tabUpdatedListener.call(this, { id: this.tabId });

    return {
      data: url,
      nextBlockId: getBlockConnection(block),
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export default newTab;

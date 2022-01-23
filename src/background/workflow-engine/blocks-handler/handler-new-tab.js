import browser from 'webextension-polyfill';
import { getBlockConnection } from '../helper';
import executeContentScript from '../execute-content-script';

async function newTab(block) {
  if (this.windowId) {
    try {
      await browser.windows.get(this.windowId);
    } catch (error) {
      this.windowId = null;
    }
  }

  const nextBlockId = getBlockConnection(block);

  try {
    const { updatePrevTab, url, active, inGroup } = block.data;

    if (updatePrevTab && this.activeTab.id) {
      await browser.tabs.update(this.activeTab.id, { url, active });
    } else {
      const tab = await browser.tabs.create({
        url,
        active,
        windowId: this.windowId,
      });

      this.activeTab.id = tab.id;
      this.activeTab.url = url;
      this.windowId = tab.windowId;
    }

    if (inGroup && !updatePrevTab) {
      const options = {
        groupId: this.activeTab.groupId,
        tabIds: this.activeTab.id,
      };

      if (!this.activeTab.groupId) {
        options.createProperties = {
          windowId: this.windowId,
        };
      }

      chrome.tabs.group(options, (tabGroupId) => {
        this.activeTab.groupId = tabGroupId;
      });
    }

    this.activeTab.frameId = 0;
    await executeContentScript(this.activeTab.id);

    return {
      data: url,
      nextBlockId,
    };
  } catch (error) {
    console.error(error);
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

export default newTab;

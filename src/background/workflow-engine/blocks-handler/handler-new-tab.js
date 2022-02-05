import browser from 'webextension-polyfill';
import { getBlockConnection } from '../helper';
import { isWhitespace } from '@/utils/helper';

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
    const isInvalidUrl = !/^https?/.test(url);

    if (isInvalidUrl) {
      const error = new Error(
        isWhitespace(url) ? 'url-empty' : 'invalid-active-tab'
      );
      error.data = { url };

      throw error;
    }

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

    return {
      data: url,
      nextBlockId,
    };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

export default newTab;

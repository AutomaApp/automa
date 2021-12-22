import browser from 'webextension-polyfill';
import { getBlockConnection } from '../helper';
import executeContentScript from '../execute-content-script';

async function activeTab(block) {
  const nextBlockId = getBlockConnection(block);

  try {
    const data = {
      nextBlockId,
      data: '',
    };

    if (this.tabId) {
      await browser.tabs.update(this.tabId, { active: true });

      return data;
    }

    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    this.frames = await executeContentScript(tab.id);

    this.frameId = 0;
    this.tabId = tab.id;
    this.activeTabUrl = tab.url;
    this.windowId = tab.windowId;

    return data;
  } catch (error) {
    console.error(error);
    return {
      data: '',
      message: error.message || error,
      nextBlockId,
    };
  }
}

export default activeTab;

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

    if (this.activeTab.id) {
      await browser.tabs.update(this.activeTab.id, { active: true });

      return data;
    }

    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.url.startsWith('http')) {
      const error = new Error('invalid-active-tab');
      error.data = { url: tab.url };

      throw error;
    }

    const frames = await executeContentScript(tab.id);

    this.activeTab = {
      ...this.activeTab,
      frames,
      frameId: 0,
      id: tab.id,
      url: tab.url,
    };
    this.windowId = tab.windowId;

    if (this.preloadScripts.length > 0) {
      const preloadScripts = this.preloadScripts.map((script) =>
        this._sendMessageToTab(script)
      );
      await Promise.allSettled(preloadScripts);
    }

    return data;
  } catch (error) {
    console.error(error);
    error.nextBlockId = nextBlockId;
    error.data = error.data || {};

    throw error;
  }
}

export default activeTab;

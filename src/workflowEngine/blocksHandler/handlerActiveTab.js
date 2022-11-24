import browser from 'webextension-polyfill';
import { sleep } from '@/utils/helper';
import { attachDebugger, injectPreloadScript } from '../helper';

async function activeTab(block) {
  try {
    const data = {
      data: '',
      nextBlockId: this.getBlockConnections(block.id),
    };

    if (this.activeTab.id) {
      await browser.tabs.update(this.activeTab.id, { active: true });

      return data;
    }

    const tabsQuery = {
      active: true,
      url: '*://*/*',
    };

    if (BROWSER_TYPE === 'firefox') {
      tabsQuery.currentWindow = true;
    } else {
      const dashboards = await browser.tabs.query({
        url: chrome.runtime.getURL('*'),
      });
      for (const dashboard of dashboards) {
        await browser.windows.update(dashboard.windowId, {
          focused: false,
          state: 'minimized',
        });
      }

      tabsQuery.lastFocusedWindow = true;
    }

    const [tab] = await browser.tabs.query(tabsQuery);
    if (!tab) {
      throw new Error("Can't find active tab");
    }
    if (!tab || !tab?.url.startsWith('http')) {
      const error = new Error('invalid-active-tab');
      error.data = { url: tab?.url };

      throw error;
    }

    this.activeTab = {
      ...this.activeTab,
      frameId: 0,
      id: tab.id,
      url: tab.url,
    };
    this.windowId = tab.windowId;

    if (this.settings.debugMode) {
      await attachDebugger(tab.id, this.activeTab.id);
      this.debugAttached = true;
    }

    if (this.preloadScripts.length > 0) {
      if (this.engine.isMV2) {
        await this._sendMessageToTab({
          isPreloadScripts: true,
          label: 'javascript-code',
          data: { scripts: this.preloadScripts },
        });
      } else {
        await injectPreloadScript({
          scripts: this.preloadScripts,
          frameSelector: this.frameSelector,
          target: {
            tabId: this.activeTab.id,
            frameIds: [this.activeTab.frameId || 0],
          },
        });
      }
    }

    await browser.tabs.update(tab.id, { active: true });
    await browser.windows.update(tab.windowId, { focused: true });

    await sleep(200);

    return data;
  } catch (error) {
    console.error(error);
    error.data = error.data || {};

    throw error;
  }
}

export default activeTab;

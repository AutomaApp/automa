import browser from 'webextension-polyfill';
import { isWhitespace, sleep } from '@/utils/helper';
import {
  getBlockConnection,
  attachDebugger,
  sendDebugCommand,
} from '../helper';

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
    const { updatePrevTab, url, active, inGroup, customUserAgent, userAgent } =
      block.data;
    const isInvalidUrl = !/^https?/.test(url);

    if (isInvalidUrl) {
      const error = new Error(
        isWhitespace(url) ? 'url-empty' : 'invalid-active-tab'
      );
      error.data = { url };

      throw error;
    }

    let tab = null;

    if (updatePrevTab && this.activeTab.id) {
      tab = await browser.tabs.update(this.activeTab.id, { url, active });
    } else {
      tab = await browser.tabs.create({
        url,
        active,
        windowId: this.windowId,
      });
    }

    this.activeTab.url = url;
    if (tab) {
      if (this.settings.debugMode || customUserAgent) {
        await attachDebugger(tab.id, this.activeTab.id);

        if (customUserAgent) {
          await sendDebugCommand(tab.id, 'Network.setUserAgentOverride', {
            userAgent,
          });
          await browser.tabs.reload(tab.id);
          await sleep(1000);
        }
      }

      this.activeTab.id = tab.id;
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

    if (!this.settings.debugMode && customUserAgent) {
      chrome.debugger.detach({ tabId: tab.id });
    }

    if (this.preloadScripts.length > 0) {
      const preloadScripts = this.preloadScripts.map((script) =>
        this._sendMessageToTab(script)
      );
      await Promise.allSettled(preloadScripts);
    }

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

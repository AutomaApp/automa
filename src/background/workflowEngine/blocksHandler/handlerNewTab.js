import browser from 'webextension-polyfill';
import { isWhitespace, sleep } from '@/utils/helper';
import {
  waitTabLoaded,
  attachDebugger,
  sendDebugCommand,
  getBlockConnection,
} from '../helper';

async function newTab({ outputs, data }) {
  if (this.windowId) {
    try {
      await browser.windows.get(this.windowId);
    } catch (error) {
      this.windowId = null;
    }
  }

  const nextBlockId = getBlockConnection({ outputs });

  try {
    const isInvalidUrl = !/^https?/.test(data.url);

    if (isInvalidUrl) {
      const error = new Error(
        isWhitespace(data.url) ? 'url-empty' : 'invalid-active-tab'
      );
      error.data = { url: data.url };

      throw error;
    }

    let tab = null;
    const isChrome = BROWSER_TYPE === 'chrome';

    if (data.updatePrevTab && this.activeTab.id) {
      tab = await browser.tabs.update(this.activeTab.id, {
        url: data.url,
        active: data.active,
      });
    } else {
      tab = await browser.tabs.create({
        url: data.url,
        active: data.active,
        windowId: this.windowId,
      });
    }

    this.activeTab.url = data.url;
    if (tab) {
      if (this.settings.debugMode || data.customUserAgent) {
        await attachDebugger(tab.id, this.activeTab.id);
        this.debugAttached = true;

        if (data.customUserAgent && isChrome) {
          await sendDebugCommand(tab.id, 'Network.setUserAgentOverride', {
            userAgent: data.userAgent,
          });
          await browser.tabs.reload(tab.id);
          await sleep(1000);
        }
      }

      this.activeTab.id = tab.id;
      this.windowId = tab.windowId;
    }

    if (data.inGroup && !data.updatePrevTab) {
      const options = {
        groupId: this.activeTab.groupId,
        tabIds: this.activeTab.id,
      };

      if (!this.activeTab.groupId) {
        options.createProperties = {
          windowId: this.windowId,
        };
      }

      if (isChrome) {
        chrome.tabs.group(options, (tabGroupId) => {
          this.activeTab.groupId = tabGroupId;
        });
      }
    }

    this.activeTab.frameId = 0;

    if (isChrome && !this.settings.debugMode && data.customUserAgent) {
      chrome.debugger.detach({ tabId: tab.id });
    }

    if (this.preloadScripts.length > 0) {
      const preloadScripts = this.preloadScripts.map((script) =>
        this._sendMessageToTab(script)
      );
      await Promise.allSettled(preloadScripts);
    }

    console.log(data, data.waitTabLoaded);
    if (data.waitTabLoaded) {
      await waitTabLoaded(
        this.activeTab.id,
        this.settings?.tabLoadTimeout ?? 30000
      );
    }

    return {
      nextBlockId,
      data: data.url,
    };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

export default newTab;

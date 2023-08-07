import browser from 'webextension-polyfill';
import { isWhitespace, sleep } from '@/utils/helper';
import {
  waitTabLoaded,
  attachDebugger,
  sendDebugCommand,
  injectPreloadScript,
} from '../helper';

function isValidURL(url) {
  try {
    // eslint-disable-next-line
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

async function newTab({ id, data }) {
  if (this.windowId) {
    try {
      await browser.windows.get(this.windowId);
    } catch (error) {
      this.windowId = null;
    }
  }

  if (!isValidURL(data.url)) {
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

  if (data.waitTabLoaded) {
    await waitTabLoaded({
      listenError: true,
      tabId: this.activeTab.id,
      ms: this.settings?.tabLoadTimeout ?? 30000,
    });
  }

  await browser.windows.update(tab.windowId, { focused: true });

  return {
    data: data.url,
    nextBlockId: this.getBlockConnections(id),
  };
}

export default newTab;

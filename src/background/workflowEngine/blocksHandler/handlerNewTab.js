import browser from 'webextension-polyfill';
import { isWhitespace, sleep } from '@/utils/helper';
import mustacheReplacer from '@/utils/referenceData/mustacheReplacer';
import { waitTabLoaded, attachDebugger, sendDebugCommand } from '../helper';

async function newTab({ id, data }, { refData }) {
  if (this.windowId) {
    try {
      await browser.windows.get(this.windowId);
    } catch (error) {
      this.windowId = null;
    }
  }

  const _url = mustacheReplacer(data.url, refData).value;

  const isInvalidUrl = !/^https?/.test(_url);

  if (isInvalidUrl) {
    const error = new Error(
      isWhitespace(_url) ? 'url-empty' : 'invalid-active-tab'
    );
    error.data = { url: _url };

    throw error;
  }

  let tab = null;
  const isChrome = BROWSER_TYPE === 'chrome';

  if (data.updatePrevTab && this.activeTab.id) {
    tab = await browser.tabs.update(this.activeTab.id, {
      url: _url,
      active: data.active,
    });
  } else {
    tab = await browser.tabs.create({
      url: _url,
      active: data.active,
      windowId: this.windowId,
    });
  }

  this.activeTab.url = _url;
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

  if (data.waitTabLoaded) {
    await waitTabLoaded({
      listenError: true,
      tabId: this.activeTab.id,
      ms: this.settings?.tabLoadTimeout ?? 30000,
    });
  }

  return {
    data: _url,
    nextBlockId: this.getBlockConnections(id),
  };
}

export default newTab;

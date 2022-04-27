import browser from 'webextension-polyfill';
import { getBlockConnection, attachDebugger } from '../helper';

export default async function ({ data, outputs }) {
  const nextBlockId = getBlockConnection({ outputs });
  const generateError = (message, errorData) => {
    const error = new Error(message);
    error.nextBlockId = nextBlockId;

    if (errorData) error.data = errorData;

    return error;
  };
  this.windowId = null;
  let [tab] = await browser.tabs.query({ url: data.matchPattern });

  if (!tab) {
    if (data.createIfNoMatch) {
      if (!data.url.startsWith('http')) {
        throw generateError('invalid-active-tab', { url: data.url });
      }

      tab = await browser.tabs.create({
        active: true,
        url: data.url,
        windowId: this.windowId,
      });
    } else {
      throw generateError('no-match-tab', { pattern: data.matchPattern });
    }
  } else {
    await browser.tabs.update(tab.id, { active: true });
  }

  if (this.settings.debugMode) {
    await attachDebugger(tab.id, this.activeTab.id);
  }

  this.activeTab.id = tab.id;
  this.activeTab.frameId = 0;
  this.activeTab.url = tab.url;
  this.windowId = tab.windowId;

  if (this.preloadScripts.length > 0) {
    const preloadScripts = this.preloadScripts.map((script) =>
      this._sendMessageToTab(script)
    );
    await Promise.allSettled(preloadScripts);
  }

  return {
    nextBlockId,
    data: tab.url,
  };
}

import browser from 'webextension-polyfill';
import { attachDebugger } from '../helper';

export default async function ({ data, id }) {
  const nextBlockId = this.getBlockConnections(id);
  const generateError = (message, errorData) => {
    const error = new Error(message);
    error.nextBlockId = nextBlockId;

    if (errorData) error.data = errorData;

    return error;
  };
  this.windowId = null;

  let tab = null;
  const activeTab = data.activeTab ?? true;
  const findTabBy = data.findTabBy || 'match-patterns';
  const isPrevNext = ['next-tab', 'prev-tab'].includes(findTabBy);

  if (!this.activeTab.id && isPrevNext) {
    throw new Error('no-tab');
  }

  const tabs =
    findTabBy !== 'match-patterns' ? await browser.tabs.query({}) : [];

  if (findTabBy === 'match-patterns') {
    [tab] = await browser.tabs.query({ url: data.matchPattern });

    if (!tab) {
      if (data.createIfNoMatch) {
        if (!data.url.startsWith('http')) {
          throw generateError('invalid-active-tab', { url: data.url });
        }

        tab = await browser.tabs.create({
          active: activeTab,
          url: data.url,
          windowId: this.windowId,
        });
      } else {
        throw generateError('no-match-tab', { pattern: data.matchPattern });
      }
    }
  } else if (isPrevNext) {
    const incrementBy = findTabBy.includes('next') ? 1 : -1;
    let tabIndex = tabs.findIndex((item) => item.id === this.activeTab.id);

    tabIndex += incrementBy;

    if (tabIndex < 0) tabIndex = tabs.length - 1;
    else if (tabIndex > tabs.length - 1) tabIndex = 0;

    tab = tabs[tabIndex];
  } else if (findTabBy === 'tab-index') {
    tab = tabs[data.tabIndex];

    if (!tab)
      throw generateError(`Can't find a tab with ${data.tabIndex} index`);
  }

  await browser.tabs.update(tab.id, { active: activeTab });

  this.activeTab.id = tab.id;
  this.activeTab.frameId = 0;
  this.activeTab.url = tab.url;
  this.windowId = tab.windowId;

  if (this.settings.debugMode) {
    await attachDebugger(tab.id, this.activeTab.id);
    this.debugAttached = true;
  }

  if (this.preloadScripts.length > 0) {
    const preloadScripts = this.preloadScripts.map((script) =>
      this._sendMessageToTab(script, {}, true)
    );
    await Promise.allSettled(preloadScripts);
  }

  return {
    nextBlockId,
    data: tab.url,
  };
}

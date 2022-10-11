import browser from 'webextension-polyfill';
import { attachDebugger, injectPreloadScript } from '../helper';

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

  const isTabsQuery = ['match-patterns', 'tab-title'];
  const tabs =
    findTabBy !== 'match-patterns' ? await browser.tabs.query({}) : [];

  if (isTabsQuery.includes(findTabBy)) {
    const query = {};

    if (data.findTabBy === 'match-patterns') query.url = data.matchPattern;
    else if (data.findTabBy === 'tab-title') query.title = data.tabTitle;

    [tab] = await browser.tabs.query(query);

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
      injectPreloadScript({
        script,
        frameSelector: this.frameSelector,
        target: {
          tabId: this.activeTab.id,
          frameIds: [this.activeTab.frameId || 0],
        },
      })
    );
    await Promise.allSettled(preloadScripts);
  }

  if (activeTab) {
    await browser.windows.update(tab.windowId, { focused: true });
  }

  return {
    nextBlockId,
    data: tab.url,
  };
}

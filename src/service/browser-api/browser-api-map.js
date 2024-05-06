import Browser from 'webextension-polyfill';

/** @type {{api: unknown, path: string; isEvent?: true}[]} */
export const browserAPIMap = [
  { api: () => Browser.tabs.get, path: 'tabs.get' },
  { api: () => Browser.tabs.query, path: 'tabs.query' },
  { isEvent: true, api: () => Browser.tabs.onRemoved, path: 'tabs.onRemoved' },
  {
    isEvent: true,
    path: 'webNavigation.onCreatedNavigationTarget',
    api: () => Browser.webNavigation.onCreatedNavigationTarget,
  },
  { api: () => Browser.windows.update, path: 'windows.update' },
  { api: () => Browser.windows.create, path: 'windows.create' },
  {
    isEvent: true,
    path: 'windows.onRemoved',
    api: () => Browser.windows.onRemoved,
  },
  { api: () => Browser.storage.local.get, path: 'storage.local.get' },
  { api: () => Browser.storage.local.set, path: 'storage.local.set' },
  { api: () => Browser.storage.local.remove, path: 'storage.local.remove' },
  { api: () => Browser.proxy.settings.clear, path: 'proxy.settings.clear' },
  {
    api: () => chrome.debugger.onEvent.addListener,
    path: 'debugger.onEvent.addListener',
  },
];

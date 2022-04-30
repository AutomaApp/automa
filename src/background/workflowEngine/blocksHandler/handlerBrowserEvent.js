import browser from 'webextension-polyfill';
import { isWhitespace } from '@/utils/helper';
import { getBlockConnection } from '../helper';

function handleEventListener(target, validate) {
  return (data, activeTab) => {
    return new Promise((resolve) => {
      let resolved = false;
      const eventListener = (event) => {
        if (resolved) return;
        if (validate && !validate(event, { data, activeTab })) return;

        target.removeListener(eventListener);
        resolve(event);
      };

      setTimeout(() => {
        resolved = true;
        target.removeListener(eventListener);
        resolve('');
      }, data.timeout || 10000);

      target.addListener(eventListener);
    });
  };
}

function onTabLoaded({ tabLoadedUrl, activeTabLoaded, timeout }, { id }) {
  return new Promise((resolve, reject) => {
    let resolved = false;

    const checkActiveTabStatus = () => {
      if (resolved) return;
      if (!id) {
        reject(new Error('no-tab'));
        return;
      }

      browser.tabs
        .get(id)
        .then((tab) => {
          if (tab.status === 'complete') {
            resolve();
            return;
          }

          setTimeout(checkActiveTabStatus, 1000);
        })
        .catch(reject);
    };

    const url = isWhitespace(tabLoadedUrl)
      ? '<all_urls>'
      : tabLoadedUrl.replace(/\s/g, '').split(',');
    const checkTabsStatus = () => {
      browser.tabs
        .query({
          url,
          status: 'loading',
        })
        .then((tabs) => {
          if (resolved) return;
          if (tabs.length === 0) {
            resolve();
            return;
          }

          setTimeout(checkTabsStatus, 1000);
        })
        .catch(reject);
    };

    if (activeTabLoaded) checkActiveTabStatus();
    else checkTabsStatus();

    setTimeout(() => {
      resolved = true;
      reject(new Error('timeout'));
    }, timeout || 10000);
  });
}

const validateCreatedTab = ({ url }, { data }) => {
  if (!isWhitespace(data.tabUrl)) {
    const regex = new RegExp(data.tabUrl, 'gi');

    if (!regex.test(url)) return false;
  }

  return true;
};
const events = {
  'tab:loaded': onTabLoaded,
  'tab:close': handleEventListener(browser.tabs.onRemoved),
  'tab:create': handleEventListener(
    browser.webNavigation.onCreatedNavigationTarget,
    validateCreatedTab
  ),
  'window:create': handleEventListener(
    browser.webNavigation.onCreatedNavigationTarget,
    validateCreatedTab
  ),
  'window:close': handleEventListener(browser.windows.onRemoved),
};

export default async function ({ data, outputs }) {
  const nextBlockId = getBlockConnection({ outputs });

  try {
    const currentEvent = events[data.eventName];

    if (!currentEvent) {
      throw new Error(`Can't find ${data.eventName} event`);
    }

    const result = await currentEvent(data, this.activeTab);

    if (data.eventName === 'tab:create' && data.setAsActiveTab) {
      this.activeTab.id = result.tabId;
      this.activeTab.url = result.url;
    }

    return {
      nextBlockId,
      data: result || '',
    };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

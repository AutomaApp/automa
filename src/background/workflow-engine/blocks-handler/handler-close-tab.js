import browser from 'webextension-polyfill';
import { getBlockConnection } from '../helper';

async function closeTab({ data, outputs }) {
  const nextBlockId = getBlockConnection({ outputs });

  try {
    let tabIds;

    if (data.activeTab && this.activeTab.id) {
      tabIds = this.activeTab.id;
    } else if (data.url) {
      tabIds = (await browser.tabs.query({ url: data.url })).map(
        (tab) => tab.id
      );
    }

    if (tabIds) await browser.tabs.remove(tabIds);

    return {
      nextBlockId,
      data: '',
    };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

export default closeTab;

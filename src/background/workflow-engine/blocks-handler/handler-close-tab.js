import browser from 'webextension-polyfill';
import { getBlockConnection } from '../helper';

async function closeTab(block) {
  const nextBlockId = getBlockConnection(block);

  try {
    const { data } = block;
    let tabIds;

    if (data.activeTab && this.tabId) {
      tabIds = this.tabId;
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
    const errorInstance = typeof error === 'string' ? new Error(error) : error;
    errorInstance.nextBlockId = nextBlockId;

    throw error;
  }
}

export default closeTab;

import browser from 'webextension-polyfill';
import { getBlockConnection } from '../helper';

export async function goBack({ outputs }) {
  const nextBlockId = getBlockConnection({ outputs });

  try {
    if (!this.activeTab.id) throw new Error('no-tab');

    await browser.tabs.goBack(this.activeTab.id);

    return {
      data: '',
      nextBlockId,
    };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

export default goBack;

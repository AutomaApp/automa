import browser from 'webextension-polyfill';
import { getBlockConnection } from '../helper';

export async function reloadTab({ outputs }) {
  const nextBlockId = getBlockConnection({ outputs });

  try {
    if (!this.activeTab.id) throw new Error('no-tab');

    await browser.tabs.reload(this.activeTab.id);

    return {
      data: '',
      nextBlockId,
    };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

export default reloadTab;

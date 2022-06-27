import browser from 'webextension-polyfill';

export async function goBack({ id }) {
  if (!this.activeTab.id) throw new Error('no-tab');

  await browser.tabs.goBack(this.activeTab.id);

  return {
    data: '',
    nextBlockId: this.getBlockConnections(id),
  };
}

export default goBack;

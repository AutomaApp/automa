import browser from 'webextension-polyfill';

export async function reloadTab({ id }) {
  if (!this.activeTab.id) throw new Error('no-tab');

  await browser.tabs.reload(this.activeTab.id);

  return {
    data: '',
    nextBlockId: this.getBlockConnections(id),
  };
}

export default reloadTab;

import BrowserAPIService from '@/service/browser-api/BrowserAPIService';

export async function reloadTab({ id }) {
  if (!this.activeTab.id) throw new Error('no-tab');

  await BrowserAPIService.tabs.reload(this.activeTab.id);

  return {
    data: '',
    nextBlockId: this.getBlockConnections(id),
  };
}

export default reloadTab;

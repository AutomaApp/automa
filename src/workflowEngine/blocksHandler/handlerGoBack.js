import BrowserAPIService from '@/service/browser-api/BrowserAPIService';

export async function goBack({ id }) {
  if (!this.activeTab.id) throw new Error('no-tab');

  await BrowserAPIService.tabs.goBack(this.activeTab.id);

  return {
    data: '',
    nextBlockId: this.getBlockConnections(id),
  };
}

export default goBack;

import browser from 'webextension-polyfill';

export async function logData({ id, data }) {
  let urls = [];

  if (data.type === 'active-tab') {
    if (!this.activeTab.id) throw new Error('no-tab');

    const tab = await browser.tabs.get(this.activeTab.id);
    urls = tab.url || tab.pendingUrl || '';
  } else {
    const tabs = await browser.tabs.query({});
    urls = tabs.map((tab) => tab.url);
  }

  if (data.assignVariable) {
    this.setVariable(data.variableName, urls);
  }
  if (data.saveData) {
    this.addDataToColumn(data.dataColumn, urls);
  }

  return {
    data: urls,
    nextBlockId: this.getBlockConnections(id),
  };
}

export default logData;

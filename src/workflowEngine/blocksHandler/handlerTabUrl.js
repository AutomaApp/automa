import browser from 'webextension-polyfill';

export async function logData({ id, data }) {
  let urls = [];

  if (data.type === 'active-tab') {
    if (!this.activeTab.id) throw new Error('no-tab');

    const tab = await browser.tabs.get(this.activeTab.id);
    urls = tab.url || tab.pendingUrl || '';
  } else {
    const query = {};

    if (data.qMatchPatterns) {
      query.url = data.qMatchPatterns;
    }
    if (data.qTitle) {
      query.title = data.qTitle;
    }

    const tabs = await browser.tabs.query(query);
    urls = tabs.map((tab) => tab.url);
  }

  if (data.assignVariable) {
    await this.setVariable(data.variableName, urls);
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

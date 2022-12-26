import browser from 'webextension-polyfill';

export default async function ({ data, id, label }) {
  const url = await this._sendMessageToTab({
    id,
    data,
    label,
  });

  if (data.openInNewTab) {
    const tab = await browser.tabs.create({
      url,
      windowId: this.activeTab.windowId,
    });

    this.activeTab.url = url;
    this.activeTab.frameId = 0;
    this.activeTab.id = tab.id;
  }

  return {
    data: url,
    nextBlockId: this.getBlockConnections(id),
  };
}

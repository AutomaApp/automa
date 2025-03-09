import BrowserAPIService from '@/service/browser-api/BrowserAPIService';

async function closeWindow(data, windowId) {
  const windowIds = [];

  if (data.allWindows) {
    const windows = await BrowserAPIService.windows.getAll();

    windows.forEach(({ id }) => {
      windowIds.push(id);
    });
  } else {
    let currentWindowId;

    if (windowId && typeof windowId === 'number') {
      currentWindowId = windowId;
    } else {
      currentWindowId = (await BrowserAPIService.windows.getCurrent()).id;
    }

    windowIds.push(currentWindowId);
  }

  await Promise.allSettled(
    windowIds.map((id) => BrowserAPIService.windows.remove(id))
  );
}

async function closeTab(data, tabId) {
  let tabIds;

  if (data.activeTab && tabId) {
    tabIds = tabId;
  } else if (data.url) {
    tabIds = (await BrowserAPIService.tabs.query({ url: data.url })).map(
      (tab) => tab.id
    );
  }

  if (tabIds) await BrowserAPIService.tabs.remove(tabIds);
}

export default async function ({ data, id }) {
  if (data.closeType === 'window') {
    await closeWindow(data, this.windowId);

    this.windowId = null;
  } else {
    await closeTab(data, this.activeTab.id);

    if (data.activeTab) {
      this.activeTab.id = null;
    }
  }

  return {
    data: '',
    nextBlockId: this.getBlockConnections(id),
  };
}

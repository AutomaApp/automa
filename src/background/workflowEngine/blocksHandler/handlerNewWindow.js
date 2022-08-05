import browser from 'webextension-polyfill';
import { attachDebugger } from '../helper';

export async function newWindow({ data, id }) {
  const windowOptions = {
    state: data.windowState,
    incognito: data.incognito,
    type: data.type || 'normal',
  };

  if (data.windowState === 'normal') {
    ['top', 'left', 'height', 'width'].forEach((key) => {
      if (data[key] <= 0) return;

      windowOptions[key] = data[key];
    });
  }
  if (data.url) windowOptions.url = data.url;

  const newWindowInstance = await browser.windows.create(windowOptions);
  this.windowId = newWindowInstance.id;

  if (data.url) {
    const [tab] = newWindowInstance.tabs;

    if (this.settings.debugMode)
      await attachDebugger(tab.id, this.activeTab.id);

    this.activeTab.id = tab.id;
    this.activeTab.url = tab.url;
  }

  return {
    data: newWindowInstance.id,
    nextBlockId: this.getBlockConnections(id),
  };
}

export default newWindow;

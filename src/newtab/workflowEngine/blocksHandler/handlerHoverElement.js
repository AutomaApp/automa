import { attachDebugger } from '../helper';

export async function hoverElement(block) {
  if (!this.activeTab.id) throw new Error('no-tab');
  if (BROWSER_TYPE !== 'chrome') {
    const error = new Error('browser-not-supported');
    error.data = { browser: BROWSER_TYPE };

    throw error;
  }

  const { debugMode, executedBlockOnWeb } = this.settings;

  if (!debugMode) {
    await attachDebugger(this.activeTab.id);
  }

  await this._sendMessageToTab({
    ...block,
    debugMode,
    executedBlockOnWeb,
    activeTabId: this.activeTab.id,
    frameSelector: this.frameSelector,
  });

  if (!debugMode) {
    chrome.debugger.detach({ tabId: this.activeTab.id });
  }

  return {
    data: '',
    nextBlockId: this.getBlockConnections(block.id),
  };
}

export default hoverElement;

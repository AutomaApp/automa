import { getBlockConnection, attachDebugger } from '../helper';

export async function hoverElement(block) {
  const nextBlockId = getBlockConnection(block);

  try {
    if (!this.activeTab.id) throw new Error('no-tab');

    const { debugMode, executedBlockOnWeb } = this.workflow.settings;

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
      nextBlockId,
    };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

export default hoverElement;

import { sleep } from '@/utils/helper';
import { getFrames } from '../helper';

async function switchTo(block) {
  const nextBlockId = this.getBlockConnections(block.id);

  try {
    if (block.data.windowType === 'main-window') {
      this.activeTab.frameId = 0;

      delete this.frameSelector;

      return {
        data: '',
        nextBlockId,
      };
    }

    const { url, isSameOrigin } = await this._sendMessageToTab(block, {
      frameId: 0,
    });

    if (isSameOrigin) {
      this.frameSelector = block.data.selector;

      return {
        data: block.data.selector,
        nextBlockId,
      };
    }

    const frames = await getFrames(this.activeTab.id);

    let frameId = frames[url] ?? null;
    if (frameId === null) {
      // Incase the iframe is redirect
      frameId = Object.entries(frames).find(([frameURL]) => {
        try {
          const currFramePathName = new URL(url).pathname;
          const framePathName = new URL(frameURL).pathname;

          return currFramePathName === framePathName;
        } catch (error) {
          return false;
        }
      })?.[1];
    }

    if (frameId !== null) {
      this.activeTab.frameId = frameId;

      await sleep(1000);

      return {
        nextBlockId,
        data: this.activeTab.frameId,
      };
    }

    throw new Error('no-iframe-id');
  } catch (error) {
    error.data = { selector: block.data.selector };
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

export default switchTo;

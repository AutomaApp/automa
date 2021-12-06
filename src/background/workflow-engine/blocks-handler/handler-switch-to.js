import { objectHasKey } from '@/utils/helper';
import { getBlockConnection } from '../helper';

async function switchTo(block) {
  const nextBlockId = getBlockConnection(block);

  try {
    if (block.data.windowType === 'main-window') {
      this.frameId = 0;

      return {
        data: '',
        nextBlockId,
      };
    }

    const { url } = await this._sendMessageToTab(block, { frameId: 0 });

    if (objectHasKey(this.frames, url)) {
      this.frameId = this.frames[url];

      return {
        data: this.frameId,
        nextBlockId,
      };
    }

    const error = new Error('no-iframe-id');
    error.data = { selector: block.selector };

    throw error;
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

export default switchTo;

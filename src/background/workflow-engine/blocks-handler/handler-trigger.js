import { getBlockConnection } from '../helper';

async function trigger(block) {
  const nextBlockId = getBlockConnection(block);

  try {
    if (block.data.type === 'visit-web' && this.tabId) {
      this.frames = await executeContentScript(this.tabId, 'trigger');
    }

    return { nextBlockId, data: '' };
  } catch (error) {
    const errorInstance = new Error(error);
    errorInstance.nextBlockId = nextBlockId;

    throw errorInstance;
  }
}

export default trigger;

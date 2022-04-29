import { getBlockConnection } from '../helper';
import executeContentScript from '../executeContentScript';

async function trigger(block) {
  const nextBlockId = getBlockConnection(block);

  try {
    if (block.data.type === 'visit-web' && this.activeTab.id) {
      await executeContentScript(this.activeTab.id);
    }

    return { nextBlockId, data: '' };
  } catch (error) {
    const errorInstance = new Error(error);
    errorInstance.nextBlockId = nextBlockId;

    throw errorInstance;
  }
}

export default trigger;

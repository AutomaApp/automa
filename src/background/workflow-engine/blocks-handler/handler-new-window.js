import browser from 'webextension-polyfill';
import { getBlockConnection } from '../helper';

export async function newWindow(block) {
  const nextBlockId = getBlockConnection(block);

  try {
    const { incognito, windowState } = block.data;
    const { id } = await browser.windows.create({
      incognito,
      state: windowState,
    });

    this.windowId = id;

    return {
      data: id,
      nextBlockId,
    };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

export default newWindow;

import { getBlockConnection } from '../helper';

async function trigger(block) {
  return new Promise((resolve) => {
    const nextBlockId = getBlockConnection(block);

    resolve({
      data: '',
      nextBlockId,
    });
  });
}

export default trigger;

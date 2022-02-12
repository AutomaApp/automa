import { getBlockConnection } from '../helper';

function delay(block) {
  return new Promise((resolve) => {
    const delayTime = +block.data.time || 500;

    setTimeout(() => {
      resolve({
        data: '',
        nextBlockId: getBlockConnection(block),
      });
    }, delayTime);
  });
}

export default delay;

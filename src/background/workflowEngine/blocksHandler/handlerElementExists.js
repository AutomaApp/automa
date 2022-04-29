import { getBlockConnection } from '../helper';

function elementExists(block) {
  return new Promise((resolve, reject) => {
    this._sendMessageToTab(block)
      .then((data) => {
        const nextBlockId = getBlockConnection(block, data ? 1 : 2);

        if (!data && block.data.throwError) {
          const error = new Error('element-not-found');
          error.nextBlockId = nextBlockId;
          error.data = { selector: block.data.selector };

          reject(error);

          return;
        }

        resolve({
          data,
          nextBlockId,
        });
      })
      .catch((error) => {
        error.nextBlockId = getBlockConnection(block);

        reject(error);
      });
  });
}

export default elementExists;

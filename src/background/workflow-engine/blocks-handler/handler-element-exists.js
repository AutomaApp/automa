import { getBlockConnection } from '../helper';

function elementExists(block) {
  return new Promise((resolve, reject) => {
    this._sendMessageToTab(block)
      .then((data) => {
        resolve({
          data,
          nextBlockId: getBlockConnection(block, data ? 1 : 2),
        });
      })
      .catch((error) => {
        error.nextBlockId = getBlockConnection(block);

        reject(error);
      });
  });
}

export default elementExists;

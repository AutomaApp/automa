function elementExists(block) {
  return new Promise((resolve, reject) => {
    this._sendMessageToTab(block)
      .then((data) => {
        if (!data && block.data.throwError) {
          const error = new Error('element-not-found');
          error.data = { selector: block.data.selector };

          reject(error);
          return;
        }

        resolve({
          data,
          nextBlockId: this.getBlockConnections(
            block.id,
            data ? 1 : 'fallback'
          ),
        });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export default elementExists;

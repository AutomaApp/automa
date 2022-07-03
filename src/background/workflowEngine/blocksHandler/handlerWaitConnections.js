async function waitConnections({ data, id }, { prevBlock }) {
  return new Promise((resolve) => {
    let timeout;
    let resolved = false;

    const nextBlockId = this.getBlockConnections(id);
    const destroyWorker =
      data.specificFlow && prevBlock?.id !== data.flowBlockId;

    const registerConnections = () => {
      const connections = this.engine.connectionsMap;
      Object.keys(connections).forEach((key) => {
        const isConnected = connections[key].includes(id);
        if (!isConnected) return;

        const prevBlockId = key.slice(0, key.indexOf('-output'));
        this.engine.waitConnections[id][prevBlockId] = {
          isHere: false,
          isContinue: false,
        };
      });
    };
    const checkConnections = () => {
      if (resolved) return;

      const state = Object.values(this.engine.waitConnections[id]);
      const isAllHere = state.every((worker) => worker.isHere);

      if (isAllHere) {
        this.engine.waitConnections[id][prevBlock.id].isContinue = true;
        const allContinue = state.every((worker) => worker.isContinue);

        if (allContinue) {
          registerConnections();
        }

        clearTimeout(timeout);

        resolve({
          data: '',
          nextBlockId,
          destroyWorker,
        });
      } else {
        setTimeout(() => {
          checkConnections();
        }, 1000);
      }
    };

    if (!this.engine.waitConnections[id]) {
      this.engine.waitConnections[id] = {};

      registerConnections();
    }

    this.engine.waitConnections[id][prevBlock.id].isHere = true;

    timeout = setTimeout(() => {
      resolved = true;

      resolve({
        data: '',
        nextBlockId,
        destroyWorker,
      });
    }, data.timeout);

    checkConnections();
  });
}

export default waitConnections;

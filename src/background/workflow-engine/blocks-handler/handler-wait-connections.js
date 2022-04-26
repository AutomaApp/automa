import { getBlockConnection } from '../helper';

async function waitConnections({ data, outputs, inputs, id }, { prevBlock }) {
  return new Promise((resolve) => {
    let timeout;
    let resolved = false;

    const nextBlockId = getBlockConnection({ outputs });
    const destroyWorker =
      data.specificFlow && prevBlock.id !== data.flowBlockId;

    const registerConnections = () => {
      inputs.input_1.connections.forEach(({ node }) => {
        this.engine.waitConnections[id][node] = {
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

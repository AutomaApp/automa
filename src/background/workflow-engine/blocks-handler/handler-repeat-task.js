import { getBlockConnection } from '../helper';

function repeatTask({ data, id, outputs }) {
  return new Promise((resolve) => {
    if (this.repeatedTasks[id] >= data.repeatFor) {
      resolve({
        data: data.repeatFor,
        nextBlockId: getBlockConnection({ outputs }),
      });
    } else {
      this.repeatedTasks[id] = (this.repeatedTasks[id] || 1) + 1;

      resolve({
        data: data.repeatFor,
        nextBlockId: getBlockConnection({ outputs }, 2),
      });
    }
  });
}

export default repeatTask;

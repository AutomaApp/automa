function repeatTask({ data, id }) {
  return new Promise((resolve) => {
    if (this.repeatedTasks[id] >= data.repeatFor) {
      delete this.repeatedTasks[id];

      resolve({
        data: data.repeatFor,
        nextBlockId: this.getBlockConnections(id),
      });
    } else {
      this.repeatedTasks[id] = (this.repeatedTasks[id] || 1) + 1;

      resolve({
        data: data.repeatFor,
        nextBlockId: this.getBlockConnections(id, 2),
      });
    }
  });
}

export default repeatTask;

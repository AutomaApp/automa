function repeatTask({ data, id }) {
  return new Promise((resolve) => {
    const repeat = Number.isNaN(+data.repeatFor) ? 0 : +data.repeatFor;

    if (this.repeatedTasks[id] > repeat || !this.getBlockConnections(id, 2)) {
      delete this.repeatedTasks[id];

      resolve({
        data: repeat,
        nextBlockId: this.getBlockConnections(id),
      });
    } else {
      this.repeatedTasks[id] = (this.repeatedTasks[id] || 1) + 1;

      resolve({
        data: repeat,
        nextBlockId: this.getBlockConnections(id, 2),
      });
    }
  });
}

export default repeatTask;

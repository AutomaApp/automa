async function trigger(block) {
  return new Promise((resolve) => {
    resolve({
      data: '',
      nextBlockId: this.getBlockConnections(block.id),
    });
  });
}

export default trigger;

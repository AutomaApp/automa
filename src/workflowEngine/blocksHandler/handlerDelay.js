function delay(block) {
  return new Promise((resolve) => {
    const delayTime = +block.data.time || 500;
    console.log(delayTime, 'huh', block);
    setTimeout(() => {
      resolve({
        data: '',
        nextBlockId: this.getBlockConnections(block.id),
      });
    }, delayTime);
  });
}

export default delay;

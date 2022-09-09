export default async function ({ data, id }) {
  let stopCurrent = false;

  if (data.type === 'stop-current') {
    return {};
  }
  if (data.type === 'stop-all') {
    const ids = [];
    this.engine.states.getAll.forEach((state) => {
      ids.push(state.id);
    });

    for (const stateId of ids) {
      if (stateId === this.engine.id) {
        stopCurrent = !data.exceptCurrent;
      } else {
        await this.engine.states.stop(stateId);
      }
    }
  }

  if (stopCurrent) return {};

  return {
    data: '',
    nextBlockId: this.getBlockConnections(id),
  };
}

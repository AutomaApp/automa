export default async function ({ data, id }) {
  let stopCurrent = false;

  if (data.type === 'stop-current') {
    return {};
  }
  if (['stop-specific', 'stop-all'].includes(data.type)) {
    const ids = [];
    const isSpecific = data.type === 'stop-specific';
    this.engine.states.getAll.forEach((state) => {
      const workflowNotIncluded =
        isSpecific && !data.workflowsToStop.includes(state.workflowId);
      if (workflowNotIncluded) return;

      ids.push(state.id);
    });

    for (const stateId of ids) {
      if (stateId === this.engine.id) {
        stopCurrent = isSpecific ? true : !data.exceptCurrent;
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

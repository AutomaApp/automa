export default async function ({ data, id }) {
  try {
    let stopCurrent = false;

    if (data.type === 'stop-current') {
      // 如果需要抛出错误
      if (data.throwError) {
        throw new Error(data.errorMessage || 'Workflow stopped manually');
      } else {
        return {};
      }
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
  } catch (error) {
    error.data = error.data || {};
    console.error(error);

    throw error;
  }
}

import WorkflowEngine from '../workflow-engine';
import dataExporter from '@/utils/data-exporter';

export function workflow(flow) {
  return new Promise((resolve, reject) => {
    const currentWorkflow = this.workflows.find(({ id }) => id === flow.itemId);

    if (!currentWorkflow) {
      const error = new Error(`Can't find workflow with ${flow.itemId} ID`);
      error.name = 'Workflow';

      reject(error);
      return;
    }

    const { globalData } = this.collection;
    this.currentWorkflow = currentWorkflow;

    const engine = new WorkflowEngine(currentWorkflow, {
      isInCollection: true,
      collectionLogId: this.id,
      collectionId: this.collection.id,
      globalData: globalData.trim() === '' ? null : globalData,
    });

    this.workflowEngine = engine;

    engine.init();
    engine.on('update', (state) => {
      this.workflowState = state;
      this.updateState();
    });
    engine.on('destroyed', ({ id, status, message }) => {
      this.data.push({
        id,
        status,
        errorMessage: message,
        workflowId: currentWorkflow.id,
        workflowName: currentWorkflow.name,
      });

      resolve({
        id,
        message,
        type: status,
        name: currentWorkflow.name,
      });
    });
  });
}

export function exportResult() {
  return new Promise((resolve) => {
    dataExporter(this.data, { name: this.collection.name, type: 'json' }, true);

    resolve({ name: 'Export result' });
  });
}

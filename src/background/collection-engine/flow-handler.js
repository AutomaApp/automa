import dataExporter from '@/utils/data-exporter';
import WorkflowEngine from '../workflow-engine/engine';
import blocksHandler from '../workflow-engine/blocks-handler';

export function workflow(flow) {
  return new Promise((resolve, reject) => {
    const currentWorkflow = this.workflows.find(({ id }) => id === flow.itemId);

    if (!currentWorkflow) {
      const error = new Error(`Can't find workflow with ${flow.itemId} ID`);
      error.name = 'Workflow';

      reject(error);
      return;
    }

    if (currentWorkflow.isDisabled) {
      resolve({
        type: 'stopped',
        name: currentWorkflow.name,
        message: 'workflow-disabled',
      });

      return;
    }

    const { globalData } = this.collection;

    const engine = new WorkflowEngine(currentWorkflow, {
      blocksHandler,
      states: this.states,
      logger: this.logger,
      options: {
        parentWorkflow: {
          id: this.id,
          isCollection: true,
          name: this.collection.name,
        },
        data: {
          globalData: globalData.trim() === '' ? null : globalData,
        },
      },
    });

    this.executedWorkflow.data = {
      id: engine.id,
      name: currentWorkflow.name,
      icon: currentWorkflow.icon,
      workflowId: currentWorkflow.id,
    };

    engine.init();
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

import browser from 'webextension-polyfill';
import WorkflowEngine from '../index';
import { getBlockConnection } from '../helper';

function workflowListener(workflow, options) {
  return new Promise((resolve, reject) => {
    const engine = new WorkflowEngine(workflow, options);
    engine.init();
    engine.on('destroyed', ({ id, status, message, currentBlock }) => {
      if (status === 'error') {
        const error = new Error(message);
        error.data = { logId: id, name: currentBlock.name };

        reject(error);
        return;
      }

      resolve({ id, status, message });
    });

    options.events.onInit(engine);
  });
}

async function executeWorkflow(block) {
  const nextBlockId = getBlockConnection(block);
  const { data } = block;

  try {
    if (data.workflowId === '') throw new Error('empty-workflow');

    const { workflows } = await browser.storage.local.get('workflows');
    const workflow = workflows.find(({ id }) => id === data.workflowId);

    if (!workflow) {
      const errorInstance = new Error('no-workflow');
      errorInstance.data = { workflowId: data.workflowId };

      throw errorInstance;
    }

    const onInit = (engine) => {
      this.childWorkflow = engine;
    };
    const options = {
      events: { onInit },
      isChildWorkflow: true,
      collectionLogId: this.id,
      collectionId: this.workflow.id,
      parentWorkflow: { name: this.workflow.name },
      globalData: !/\S/g.test(data.globalData) ? null : data.globalData,
    };

    if (workflow.drawflow.includes(this.workflow.id)) {
      throw new Error('workflow-infinite-loop');
    }

    const result = await workflowListener(workflow, options);

    return {
      data: '',
      logId: result.id,
      nextBlockId,
    };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

export default executeWorkflow;

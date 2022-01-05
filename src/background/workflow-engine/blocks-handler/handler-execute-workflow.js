import browser from 'webextension-polyfill';
import WorkflowEngine from '../engine';
import { getBlockConnection } from '../helper';
import { isWhitespace } from '@/utils/helper';

function workflowListener(workflow, options) {
  return new Promise((resolve, reject) => {
    const engine = new WorkflowEngine(workflow, options);
    engine.init();
    engine.on('destroyed', ({ id, status, message }) => {
      if (status === 'error') {
        const error = new Error(message);
        error.data = { logId: id };

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
    const options = {
      parentWorkflow: {
        id: this.id,
        name: this.workflow.name,
      },
      events: {
        onInit: (engine) => {
          this.childWorkflowId = engine.id;
        },
      },
      states: this.states,
      logger: this.logger,
      blocksHandler: this.blocksHandler,
      globalData: isWhitespace(data.globalData) ? null : data.globalData,
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

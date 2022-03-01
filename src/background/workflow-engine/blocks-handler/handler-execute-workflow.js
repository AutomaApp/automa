import browser from 'webextension-polyfill';
import WorkflowEngine from '../engine';
import { getBlockConnection } from '../helper';
import { isWhitespace, parseJSON } from '@/utils/helper';
import decryptFlow, { getWorkflowPass } from '@/utils/decrypt-flow';

function workflowListener(workflow, options) {
  return new Promise((resolve, reject) => {
    if (workflow.isProtected) {
      const flow = parseJSON(workflow.drawflow, null);

      if (!flow) {
        const pass = getWorkflowPass(workflow.pass);

        workflow.drawflow = decryptFlow(workflow, pass);
      }
    }

    const engine = new WorkflowEngine(workflow, options);
    engine.init();
    engine.on('destroyed', ({ id, status, message }) => {
      options.events.onDestroyed(engine);

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

async function executeWorkflow({ outputs, data }) {
  const nextBlockId = getBlockConnection({ outputs });

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
      options: {
        data: {
          globalData: isWhitespace(data.globalData) ? null : data.globalData,
        },
        parentWorkflow: {
          id: this.id,
          name: this.workflow.name,
        },
      },
      events: {
        onInit: (engine) => {
          this.childWorkflowId = engine.id;
        },
        onDestroyed: (engine) => {
          if (data.executeId) {
            const { dataColumns, globalData, googleSheets, table } =
              engine.referenceData;

            this.referenceData.workflow[data.executeId] = {
              globalData,
              dataColumns,
              googleSheets,
              table: table || dataColumns,
            };
          }
        },
      },
      states: this.states,
      logger: this.logger,
      blocksHandler: this.blocksHandler,
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

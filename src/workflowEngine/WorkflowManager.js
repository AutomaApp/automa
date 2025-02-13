import dayjs from '@/lib/dayjs';
import BrowserAPIService from '@/service/browser-api/BrowserAPIService';
import { fetchApi } from '@/utils/api';
import convertWorkflowData from '@/utils/convertWorkflowData';
import getBlockMessage from '@/utils/getBlockMessage';
import blocksHandler from './blocksHandler';
import WorkflowEngine from './WorkflowEngine';
import WorkflowEvent from './workflowEvent';
import WorkflowLogger from './WorkflowLogger';
import WorkflowState from './WorkflowState';

const workflowStateStorage = {
  get() {
    return BrowserAPIService.storage.local
      .get('workflowStates')
      .then(({ workflowStates }) => workflowStates || []);
  },
  set(key, value) {
    const states = Object.values(value);

    return BrowserAPIService.storage.local.set({ workflowStates: states });
  },
};

class WorkflowManager {
  /** @type {WorkflowManager} */
  static #_instance;

  /**
   * WorkflowManager singleton
   * @type {WorkflowManager}
   */
  static get instance() {
    if (!this.#_instance) this.#_instance = new WorkflowManager();

    return this.#_instance;
  }

  /** @type {WorkflowState} */
  #state;

  /** @type {WorkflowLogger} */
  #logger;

  constructor() {
    this.#logger = new WorkflowLogger();
    this.#state = new WorkflowState({ storage: workflowStateStorage });
  }

  execute(workflowData, options) {
    if (workflowData.testingMode) {
      for (const value of this.#state.states.values()) {
        if (value.workflowId === workflowData.id) return null;
      }
    }

    const convertedWorkflow = convertWorkflowData(workflowData);
    const engine = new WorkflowEngine(convertedWorkflow, {
      options,
      states: this.#state,
      logger: this.#logger,
      blocksHandler: blocksHandler(),
    });

    engine.init();
    engine.on('destroyed', ({ id, status, history, blockDetail, ...rest }) => {
      if (status !== 'stopped') {
        BrowserAPIService.permissions
          .contains({ permissions: ['notifications'] })
          .then((hasPermission) => {
            if (!hasPermission || !workflowData.settings.notification) return;

            const name = workflowData.name.slice(0, 32);

            BrowserAPIService.notifications.create(`logs:${id}`, {
              type: 'basic',
              iconUrl: BrowserAPIService.runtime.getURL('icon-128.png'),
              title: status === 'success' ? 'Success' : 'Error',
              message: `${
                status === 'success' ? 'Successfully' : 'Failed'
              } ran the "${name}" workflow`,
            });
          });
      }

      if (convertedWorkflow.settings?.events) {
        const workflowHistory = history.map((item) => {
          delete item.logId;
          delete item.prevBlockData;
          delete item.workerId;

          item.description = item.description || '';

          return item;
        });
        const workflowRefData = {
          status,
          startedAt: rest.startedTimestamp,
          endedAt: rest.endedTimestamp
            ? rest.endedTimestamp - rest.startedTimestamp
            : null,
          logs: workflowHistory,
          errorMessage:
            status === 'error' ? getBlockMessage(blockDetail) : null,
        };

        convertedWorkflow.settings.events.forEach((event) => {
          if (status === 'success' && !event.events.includes('finish:success'))
            return;
          if (status === 'error' && !event.events.includes('finish:failed'))
            return;

          WorkflowEvent.handle(event.action, {
            workflow: workflowRefData,
            variables: { ...engine.referenceData.variables },
            globalData: { ...engine.referenceData.globalData },
          });
        });
      }
    });

    BrowserAPIService.storage.local
      .get('checkStatus')
      .then((res) => {
        const { checkStatus } = res || { checkStatus: null };
        const isSameDay = checkStatus
          ? dayjs().isSame(checkStatus, 'day')
          : false;
        if (!isSameDay || !checkStatus) {
          fetchApi('/status')
            .then((response) => response.json())
            .then(() => {
              BrowserAPIService.storage.local.set({
                checkStatus: new Date().toString(),
              });
            })
            .catch((error) => {
              console.error('Failed to check status:', error);
            });
        }
      })
      .catch((error) => {
        console.error('Failed to get checkStatus:', error);
      });

    return engine;
  }

  /**
   * Stop workflow execution
   * @param {string} stateId
   * @returns {Promise<void>}
   */
  stopExecution(stateId) {
    return this.#state.stop(stateId);
  }

  /**
   * Resume workflow execution
   * @param {string} id
   * @param {object} nextBlock
   * @returns {Promise<void>}
   */
  resumeExecution(id, nextBlock) {
    return this.#state.resume(id, nextBlock);
  }

  /**
   * Resume workflow execution
   * @param {string} id
   * @param {object} stateData
   * @returns {Promise<void>}
   */
  updateExecution(id, stateData) {
    return this.#state.update(id, stateData);
  }
}

export default WorkflowManager;

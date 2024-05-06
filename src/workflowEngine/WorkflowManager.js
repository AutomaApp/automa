import browser from 'webextension-polyfill';
import { fetchApi } from '@/utils/api';
import getBlockMessage from '@/utils/getBlockMessage';
import convertWorkflowData from '@/utils/convertWorkflowData';
import dayjs from '@/lib/dayjs';
import WorkflowEvent from './WorkflowEvent';
import WorkflowState from './WorkflowState';
import WorkflowLogger from './WorkflowLogger';
import WorkflowEngine from './WorkflowEngine';
import blocksHandler from './blocksHandler';

const workflowStateStorage = {
  get() {
    return browser.storage.local
      .get('workflowStates')
      .then(({ workflowStates }) => workflowStates || []);
  },
  set(key, value) {
    const states = Object.values(value);

    return browser.storage.local.set({ workflowStates: states });
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
        browser.permissions
          .contains({ permissions: ['notifications'] })
          .then((hasPermission) => {
            if (!hasPermission || !workflowData.settings.notification) return;

            const name = workflowData.name.slice(0, 32);

            browser.notifications.create(`logs:${id}`, {
              type: 'basic',
              iconUrl: browser.runtime.getURL('icon-128.png'),
              title: status === 'success' ? 'Success' : 'Error',
              message: `${
                status === 'success' ? 'Successfully' : 'Failed'
              } to run the "${name}" workflow`,
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

    browser.storage.local.get('checkStatus').then(({ checkStatus }) => {
      const isSameDay = dayjs().isSame(checkStatus, 'day');
      if (!isSameDay || !checkStatus) {
        fetchApi('/status')
          .then((response) => response.json())
          .then(() => {
            browser.storage.local.set({ checkStatus: new Date().toString() });
          });
      }
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

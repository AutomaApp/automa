import { IS_FIREFOX } from '@/common/utils/constant';
import browser from 'webextension-polyfill';
import BackgroundOffscreen from './BackgroundOffscreen';

class BackgroundWorkflowUtils {
  /** @type {BackgroundWorkflowUtils} */
  static #_instance;

  /**
   * BackgroundWorkflowUtils singleton
   * @type {BackgroundWorkflowUtils}
   */
  static get instance() {
    if (!this.#_instance) this.#_instance = new BackgroundWorkflowUtils();

    return this.#_instance;
  }

  /** @type {import('@/workflowEngine/WorkflowManager').default} */
  #workflowManager;

  constructor() {
    this.#workflowManager = null;
  }

  static flattenTeamWorkflows(workflows) {
    return Object.values(Object.values(workflows || {})[0] || {});
  }

  static async getWorkflow(workflowId) {
    if (!workflowId) return null;

    if (workflowId.startsWith('team')) {
      const { teamWorkflows } = await browser.storage.local.get(
        'teamWorkflows'
      );
      if (!teamWorkflows) return null;

      const workflows = this.flattenTeamWorkflows(teamWorkflows);

      return workflows.find((item) => item.id === workflowId);
    }

    const { workflows, workflowHosts } = await browser.storage.local.get([
      'workflows',
      'workflowHosts',
    ]);
    let findWorkflow = Array.isArray(workflows)
      ? workflows.find(({ id }) => id === workflowId)
      : workflows[workflowId];

    if (!findWorkflow) {
      findWorkflow = Object.values(workflowHosts || {}).find(
        ({ hostId }) => hostId === workflowId
      );

      if (findWorkflow) findWorkflow.id = findWorkflow.hostId;
    }

    return findWorkflow;
  }

  async #ensureWorkflowManager() {
    if (!IS_FIREFOX) return;

    this.#workflowManager = (
      await import('@/workflowEngine/WorkflowManager')
    ).default.instance;
  }

  /**
   * Stop workflow execution
   * @param {string} stateId
   * @returns {Promise<void>}
   */
  async stopExecution(stateId) {
    if (IS_FIREFOX) {
      await this.#ensureWorkflowManager();
      this.#workflowManager.stopExecution(stateId);
      return;
    }

    await BackgroundOffscreen.instance.sendMessage('workflow:stop', stateId);
  }

  /**
   * Resume workflow execution
   * @param {string} stateId
   * @param {object} nextBlock
   * @returns {Promise<void>}
   */
  async resumeExecution(stateId, nextBlock) {
    if (IS_FIREFOX) {
      await this.#ensureWorkflowManager();
      this.#workflowManager.resumeExecution(stateId, nextBlock);
      return;
    }

    await BackgroundOffscreen.instance.sendMessage('workflow:resume', {
      id: stateId,
      nextBlock,
    });
  }

  /**
   * Update workflow execution state
   * @param {string} stateId
   * @param {object} data
   * @returns {Promise<void>}
   */
  async updateExecutionState(stateId, data) {
    if (IS_FIREFOX) {
      await this.#ensureWorkflowManager();
      this.#workflowManager.updateExecution(stateId, data);
      return;
    }

    await BackgroundOffscreen.instance.sendMessage('workflow:update', {
      data,
      id: stateId,
    });
  }

  async executeWorkflow(workflowData, options) {
    if (workflowData.isDisabled) return;

    if (IS_FIREFOX) {
      await this.#ensureWorkflowManager();
      this.#workflowManager.execute(workflowData, options);
      return;
    }

    await BackgroundOffscreen.instance.sendMessage('workflow:execute', {
      workflow: workflowData,
      options,
    });
  }
}

export default BackgroundWorkflowUtils;

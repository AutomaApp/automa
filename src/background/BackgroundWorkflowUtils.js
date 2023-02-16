import browser from 'webextension-polyfill';
import { startWorkflowExec } from '@/workflowEngine';

class BackgroundWorkflowUtils {
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

  static async executeWorkflow(workflowData, options) {
    if (workflowData.isDisabled) return;

    /**
     * Under v2, the background runtime environment is a real browser window. It has DOM, URL...
      But these don't exist under v3. v3 uses service_worker (https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API), so a dashboard page is created to run the workflow
      So v2 and isPopup are actually the same
     */
    const isMV2 = browser.runtime.getManifest().manifest_version === 2;
    startWorkflowExec(workflowData, options, isMV2);
  }
}

export default BackgroundWorkflowUtils;

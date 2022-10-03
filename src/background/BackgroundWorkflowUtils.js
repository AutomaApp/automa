import browser from 'webextension-polyfill';
import BackgroundUtils from './BackgroundUtils';

const flattenTeamWorkflows = (workflows) =>
  Object.values(Object.values(workflows)[0]);

class BackgroundWorkflowUtils {
  static async getWorkflow(workflowId) {
    if (!workflowId) return null;

    if (workflowId.startsWith('team')) {
      const { teamWorkflows } = await browser.storage.local.get(
        'teamWorkflows'
      );
      if (!teamWorkflows) return null;

      const workflows = flattenTeamWorkflows(teamWorkflows);

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
    await BackgroundUtils.openDashboard('', false);
    const result = await BackgroundUtils.sendMessageToDashboard(
      'workflow:execute',
      {
        data: workflowData,
        options,
      }
    );

    return result;
  }
}

export default BackgroundWorkflowUtils;

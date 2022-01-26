import { parseJSON, fileSaver, openFilePicker } from './helper';
import Workflow from '@/models/workflow';

export function importWorkflow() {
  openFilePicker(['application/json'])
    .then((file) => {
      const reader = new FileReader();

      reader.onload = ({ target }) => {
        const workflow = JSON.parse(target.result);

        if (workflow.includedWorkflows) {
          Object.keys(workflow.includedWorkflows).forEach((workflowId) => {
            const isWorkflowExists = Workflow.query()
              .where('id', workflowId)
              .exists();

            if (isWorkflowExists) return;

            Workflow.insert({
              data: {
                ...workflow.includedWorkflows[workflowId],
                id: workflowId,
                createdAt: Date.now(),
              },
            });
          });

          delete workflow.includedWorkflows;
        }

        Workflow.insert({ data: { ...workflow, createdAt: Date.now() } });
      };

      reader.readAsText(file);
    })
    .catch((error) => {
      console.error(error);
    });
}

function convertWorkflow(workflow) {
  const keys = [
    'name',
    'icon',
    'version',
    'drawflow',
    'settings',
    'globalData',
    'description',
    'dataColumns',
  ];
  const content = {
    extVersion: chrome.runtime.getManifest().version,
  };

  keys.forEach((key) => {
    content[key] = workflow[key];
  });

  return content;
}
function findIncludedWorkflows({ drawflow }, maxDepth = 3, workflows = {}) {
  if (maxDepth === 0) return workflows;

  const blocks = parseJSON(drawflow, null)?.drawflow.Home.data;

  if (!blocks) return workflows;

  Object.values(blocks).forEach(({ data, name }) => {
    if (name !== 'execute-workflow' || workflows[data.workflowId]) return;

    const workflow = Workflow.find(data.workflowId);
    workflows[data.workflowId] = convertWorkflow(workflow);

    findIncludedWorkflows(workflow, maxDepth - 1, workflows);
  });

  return workflows;
}
export function exportWorkflow(workflow) {
  const includedWorkflows = findIncludedWorkflows(workflow);
  const content = convertWorkflow(workflow);

  content.includedWorkflows = includedWorkflows;

  const blob = new Blob([JSON.stringify(content)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);

  fileSaver(`${workflow.name}.json`, url);
}

export default {
  export: exportWorkflow,
  import: importWorkflow,
};

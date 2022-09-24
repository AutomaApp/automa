import browser from 'webextension-polyfill';
import { useWorkflowStore } from '@/stores/workflow';
import { parseJSON, fileSaver, openFilePicker } from './helper';

const contextMenuPermission =
  BROWSER_TYPE === 'firefox' ? 'menus' : 'contextMenus';
const checkPermission = (permissions) =>
  browser.permissions.contains({ permissions });
const requiredPermissions = {
  trigger: {
    name: contextMenuPermission,
    hasPermission({ data }) {
      if (data.type !== 'context-menu') return true;

      return checkPermission([contextMenuPermission]);
    },
  },
  clipboard: {
    name: 'clipboardRead',
    hasPermission() {
      return checkPermission(['clipboardRead']);
    },
  },
  notification: {
    name: 'notifications',
    hasPermission() {
      return checkPermission(['notifications']);
    },
  },
  'handle-download': {
    name: 'downloads',
    hasPermission() {
      return checkPermission(['downloads']);
    },
  },
  'save-assets': {
    name: 'downloads',
    hasPermission() {
      return checkPermission(['downloads']);
    },
  },
  cookie: {
    name: 'cookies',
    hasPermission() {
      return checkPermission(['cookies']);
    },
  },
};

export async function getWorkflowPermissions(drawflow) {
  let blocks = [];
  const permissions = [];
  const drawflowData =
    typeof drawflow === 'string' ? parseJSON(drawflow) : drawflow;

  if (drawflowData.nodes) {
    blocks = drawflowData.nodes;
  } else {
    blocks = Object.values(drawflowData.drawflow?.Home?.data || {});
  }

  for (const block of blocks) {
    const name = block.label || block.name;
    const permission = requiredPermissions[name];

    if (permission && !permissions.includes(permission.name)) {
      const hasPermission = await permission.hasPermission(block);
      if (!hasPermission) permissions.push(permission.name);
    }
  }

  return permissions;
}

export function importWorkflow(attrs = {}) {
  return new Promise((resolve, reject) => {
    openFilePicker(['application/json'], attrs)
      .then((files) => {
        const handleOnLoadReader = ({ target }) => {
          const workflow = JSON.parse(target.result);
          const workflowStore = useWorkflowStore();

          if (workflow.includedWorkflows) {
            Object.keys(workflow.includedWorkflows).forEach((workflowId) => {
              const isWorkflowExists = Boolean(
                workflowStore.workflows[workflowId]
              );

              if (isWorkflowExists) return;

              const currentWorkflow = workflow.includedWorkflows[workflowId];
              currentWorkflow.table =
                currentWorkflow.table || currentWorkflow.dataColumns;
              delete currentWorkflow.dataColumns;

              workflowStore.insert(
                {
                  ...currentWorkflow,
                  id: workflowId,
                  createdAt: Date.now(),
                },
                { duplicateId: true }
              );
            });

            delete workflow.includedWorkflows;
          }

          workflow.table = workflow.table || workflow.dataColumns;
          delete workflow.dataColumns;

          if (typeof workflow.drawflow === 'string')
            workflow.drawflow = parseJSON(workflow.drawflow, {});

          workflowStore
            .insert({
              ...workflow,
              createdAt: Date.now(),
            })
            .then(resolve);
        };

        files.forEach((file) => {
          const reader = new FileReader();

          reader.onload = handleOnLoadReader;
          reader.readAsText(file);
        });
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
}

const defaultValue = {
  name: '',
  icon: '',
  table: [],
  settings: {},
  globalData: '',
  dataColumns: [],
  description: '',
  drawflow: { nodes: [], edges: [] },
  version: browser.runtime.getManifest().version,
};

export function convertWorkflow(workflow, additionalKeys = []) {
  if (!workflow) return null;

  const keys = [
    'name',
    'icon',
    'table',
    'version',
    'drawflow',
    'settings',
    'globalData',
    'description',
    ...additionalKeys,
  ];
  const content = {
    extVersion: browser.runtime.getManifest().version,
  };

  keys.forEach((key) => {
    content[key] = workflow[key] ?? defaultValue[key];
  });

  return content;
}
function findIncludedWorkflows(
  { drawflow },
  store,
  maxDepth = 3,
  workflows = {}
) {
  if (maxDepth === 0) return workflows;

  const flow = parseJSON(drawflow, drawflow);
  const blocks = flow?.drawflow?.Home.data ?? flow.nodes ?? null;
  if (!blocks) return workflows;

  const checkWorkflow = (type, workflowId) => {
    if (type !== 'execute-workflow' || workflows[workflowId]) return;

    const workflow = store.getById(workflowId);
    if (workflow) {
      workflows[workflowId] = convertWorkflow(workflow);
      findIncludedWorkflows(workflow, store, maxDepth - 1, workflows);
    }
  };

  if (flow.nodes) {
    flow.nodes.forEach((node) => {
      checkWorkflow(node.label, node.data.workflowId);
    });
  } else {
    Object.values(blocks).forEach(({ data, name }) => {
      checkWorkflow(name, data.workflowId);
    });
  }

  return workflows;
}
export function exportWorkflow(workflow) {
  if (workflow.isProtected) return;

  const workflowStore = useWorkflowStore();
  const includedWorkflows = findIncludedWorkflows(workflow, workflowStore);
  const content = convertWorkflow(workflow);

  content.includedWorkflows = includedWorkflows;

  const blob = new Blob([JSON.stringify(content)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);

  fileSaver(`${workflow.name}.automa.json`, url);
}

export default {
  export: exportWorkflow,
  import: importWorkflow,
};

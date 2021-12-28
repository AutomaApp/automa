import { fileSaver, openFilePicker } from './helper';
import Workflow from '@/models/workflow';

export function importWorkflow() {
  openFilePicker(['application/json'])
    .then((file) => {
      const reader = new FileReader();

      reader.onload = ({ target }) => {
        const workflow = JSON.parse(target.result);

        Workflow.insert({ data: { ...workflow, createdAt: Date.now() } });
      };

      reader.readAsText(file);
    })
    .catch((error) => {
      console.error(error);
    });
}

export function exportWorkflow(workflow) {
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

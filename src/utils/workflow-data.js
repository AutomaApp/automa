import { fileSaver } from './helper';
import Workflow from '@/models/workflow';

export function importWorkflow() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';

  input.onchange = (event) => {
    const file = event.target.files[0];

    if (!file || file.type !== 'application/json') {
      alert('Invalid file');
      return;
    }

    const reader = new FileReader();

    reader.onload = ({ target }) => {
      try {
        const workflow = JSON.parse(target.result);

        Workflow.insert({ data: workflow });
      } catch (error) {
        console.error(error);
      }
    };

    reader.readAsText(file);
  };

  input.click();
}

export function exportWorkflow(workflow) {
  const keys = ['dataColumns', 'drawflow', 'icon', 'name', 'settings'];
  const content = {};

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

import { parseJSON } from '@/utils/helper';
import { sendMessage } from '@/utils/message';
import Browser from 'webextension-polyfill';

function getWorkflowDetail() {
  let hash = window.location.hash.slice(1);
  if (!hash.startsWith('/')) hash = `/${hash}`;

  const { pathname, searchParams } = new URL(window.location.origin + hash);

  const variables = {};
  const { 1: workflowId } = pathname.split('/');

  searchParams.forEach((key, value) => {
    const varValue = parseJSON(decodeURIComponent(value), '##_empty');
    if (varValue === '##_empty') return;

    variables[key] = varValue;
  });

  return { workflowId: workflowId ?? '', variables };
}

function writeResult(text) {
  document.body.innerText = text;
}

(async () => {
  try {
    const { workflowId, variables } = getWorkflowDetail();
    if (!workflowId) {
      writeResult('Invalid path');
      return;
    }

    const { workflows } = await Browser.storage.local.get('workflows');

    let workflow = workflows[workflowId];
    if (!workflow && Array.isArray(workflows)) {
      workflow = workflows.find((item) => item.id === workflowId);
    }

    if (!workflow) {
      writeResult('Workflow not found');
      return;
    }

    const hasVariables = Object.keys(variables).length > 0;

    writeResult('Executing workflow');

    sendMessage(
      'workflow:execute',
      {
        ...workflow,
        options: { checkParam: !hasVariables, data: { variables } },
      },
      'background'
    ).then(() => {
      setTimeout(window.close, 1000);
    });
  } catch (error) {
    console.error(error);
  }
})();

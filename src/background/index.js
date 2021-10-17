import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';
import { MessageListener } from '@/utils/message';
import executingWorkflow from '@/utils/executing-workflow';
import WorkflowEngine from './workflow-engine';

browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    browser.storage.local.set({
      logs: [],
      workflows: [],
      visitWebTriggers: [],
      executingWorkflow: [],
    });
  }
});

function getWorkflow(workflowId) {
  return new Promise((resolve) => {
    browser.storage.local.get('workflows').then(({ workflows }) => {
      const workflow = workflows.find(({ id }) => id === workflowId);

      resolve(workflow);
    });
  });
}
async function executeWorkflow(workflow) {
  try {
    const id = nanoid();
    const engine = new WorkflowEngine(id, workflow);

    executingWorkflow.set(id, {});

    engine.init();
    engine.on('destroyed', () => {
      console.log('destroyed...');
      executingWorkflow.delete(workflow.id);
    });

    return true;
  } catch (error) {
    console.error(error);
    return error;
  }
}

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const { visitWebTriggers } = await browser.storage.local.get(
      'visitWebTriggers'
    );
    const trigger = visitWebTriggers.find(({ url, isRegex }) => {
      if (url.trim() === '') return false;

      return tab.url.match(isRegex ? new RegExp(url, 'g') : url);
    });
    const executedWorkflow = await executingWorkflow.find(
      ({ workflow }) => workflow?.tabId === tabId
    );
    console.log(executedWorkflow, 'wo');
    if (trigger && !executedWorkflow) {
      const workflow = await getWorkflow(trigger.id);

      executeWorkflow(workflow);
    }
  }
});
browser.alarms.onAlarm.addListener(({ name }) => {
  getWorkflow(name).then((workflow) => {
    if (!workflow) return;
    console.log(workflow, 'alarm');
    executeWorkflow(workflow);
  });
});

const message = new MessageListener('background');

message.on('workflow:execute', executeWorkflow);

chrome.runtime.onMessage.addListener(message.listener());

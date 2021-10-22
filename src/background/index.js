import browser from 'webextension-polyfill';
import { MessageListener } from '@/utils/message';
import workflowState from './workflow-state';
import WorkflowEngine from './workflow-engine';

function getWorkflow(workflowId) {
  return new Promise((resolve) => {
    browser.storage.local.get('workflows').then(({ workflows }) => {
      const workflow = workflows.find(({ id }) => id === workflowId);

      resolve(workflow);
    });
  });
}
async function executeWorkflow(workflow, tabId) {
  try {
    const engine = new WorkflowEngine(workflow, tabId);

    engine.init();
    engine.on('destroyed', () => {
      console.log('destroyed...');
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
    const runningWorkflow = await workflowState.get(
      (item) => item.state.tabId === tabId
    );
    console.log(runningWorkflow.length, runningWorkflow);
    if (trigger && runningWorkflow.length === 0) {
      const workflow = await getWorkflow(trigger.id);

      executeWorkflow(workflow, tabId);
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

browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    browser.storage.local.set({
      logs: [],
      workflows: [],
      workflowState: [],
      visitWebTriggers: [],
    });
  }
});

const message = new MessageListener('background');

message.on('workflow:execute', (workflow) => executeWorkflow(workflow));

browser.runtime.onMessage.addListener(message.listener());

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
async function executeWorkflow(workflow) {
  try {
    const engine = new WorkflowEngine(workflow);

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
    const runningWorkflow = (await workflowState.get()).find(
      (item) => item.state.tabId === tabId
    );

    if (trigger && !runningWorkflow) {
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

browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    browser.storage.local.set({
      logs: [],
      workflows: [],
      visitWebTriggers: [],
      runningWorkflows: [],
    });
  }
});

const message = new MessageListener('background');

message.on('workflow:execute', executeWorkflow);

chrome.runtime.onMessage.addListener(message.listener());

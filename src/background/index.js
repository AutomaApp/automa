import browser from 'webextension-polyfill';
import { MessageListener } from '@/utils/message';
import WorkflowEngine from './workflow-engine';

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.storage.local.set({
      workflows: [],
      visitWebTriggers: [],
      tasks: [],
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
function executeWorkflow(workflow) {
  try {
    const engine = new WorkflowEngine(workflow);
    console.log('execute');
    engine.init();

    return true;
  } catch (error) {
    console.error(error);
    return error;
  }
}

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const visitWebTriggers =
      (await browser.storage.local.get('visitWebTriggers'))?.visitWebTriggers ??
      [];
    const trigger = visitWebTriggers.find(({ url, isRegex }) => {
      if (url.trim() === '') return false;

      return tab.url.match(isRegex ? new RegExp(url, 'g') : url);
    });

    if (trigger) {
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

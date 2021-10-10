import { MessageListener } from '@/utils/message';
import WorkflowEngine from './workflow-engine';

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.storage.local.set({
      workflows: [],
      tasks: [],
    });
  }
});

const message = new MessageListener('background');

message.on('workflow:execute', (workflow) => {
  try {
    const engine = new WorkflowEngine(workflow);
    console.log('execute');
    engine.init();

    return true;
  } catch (error) {
    console.error(error);
    return error;
  }
});

chrome.runtime.onMessage.addListener(message.listener());

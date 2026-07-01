import BrowserAPIEventHandler from '@/service/browser-api/BrowserAPIEventHandler';
import { MessageListener } from '@/utils/message';
import WorkflowManager from '@/workflowEngine/WorkflowManager';
import Browser from 'webextension-polyfill';

const messageListener = new MessageListener('offscreen');
Browser.runtime.onMessage.addListener(messageListener.listener);

messageListener.on('workflow:execute', ({ workflow, options }) => {
  WorkflowManager.instance.execute(workflow, options);
});

messageListener.on('workflow:stop', (stateId) => {
  WorkflowManager.instance.stopExecution(stateId);
});

messageListener.on('workflow:resume', ({ id, nextBlock }) => {
  WorkflowManager.instance.resumeExecution(id, nextBlock);
});

messageListener.on('workflow:update', ({ id, data }) => {
  WorkflowManager.instance.updateExecution(id, data);
});

messageListener.on(BrowserAPIEventHandler.RuntimeEvents.ON_EVENT, (event) =>
  BrowserAPIEventHandler.instance.onBrowserEventListener(event)
);

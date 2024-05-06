import { MessageListener } from '@/utils/message';
import WorkflowManager from '@/workflowEngine/WorkflowManager';
import { runtime } from 'webextension-polyfill';

const messageListener = new MessageListener('offscreen');
runtime.onMessage.addListener(messageListener.listener);

messageListener.on('workflow:execute', (data) => {
  WorkflowManager.instance.execute(data);
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

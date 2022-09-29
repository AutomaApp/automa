/* eslint-disable */
import browser from 'webextension-polyfill';
import BackgroundUtils from './BackgroundUtils';

class BackgroundWorkflowTriggers {
	async visitWebTriggers(tabId, tabUrl) {
	  const { visitWebTriggers } = await browser.storage.local.get('visitWebTriggers');
	  if (!visitWebTriggers || visitWebTriggers.length === 0) return;

	  const triggeredWorkflow = visitWebTriggers.find(({ url, isRegex }) => {
	    if (url.trim() === '') return false;

	    return tabUrl.match(isRegex ? new RegExp(url, 'g') : url);
	  });

	  if (triggeredWorkflow) {
	    let workflowId = triggeredWorkflow.id;
	    if (triggeredWorkflow.id.startsWith('trigger')) {
	      const { 1: triggerWorkflowId } = triggeredWorkflow.id.split(':');
	      workflowId = triggerWorkflowId;
	    }

	    const workflowData = await BackgroundUtils.getWorkflow(workflowId);
	    if (workflowData) BackgroundUtils.executeWorkflow(workflowData, { tabId });
	  }
	}
}

export default BackgroundWorkflowTriggers;
/* eslint-disable no-restricted-globals */
import { toRaw } from 'vue';
import browser from 'webextension-polyfill';
import dayjs from '@/lib/dayjs';
import { parseJSON } from '@/utils/helper';
import { fetchApi } from '@/utils/api';
import { sendMessage } from '@/utils/message';
import convertWorkflowData from '@/utils/convertWorkflowData';
import getBlockMessage from '@/utils/getBlockMessage';
import WorkflowState from './WorkflowState';
import WorkflowLogger from './WorkflowLogger';
import WorkflowEngine from './WorkflowEngine';
import blocksHandler from './blocksHandler';
import { workflowEventHandler } from './workflowEvent';

const workflowStateStorage = {
  get() {
    return browser.storage.local
      .get('workflowStates')
      .then(({ workflowStates }) => workflowStates || []);
  },
  set(key, value) {
    const states = Object.values(value);

    return browser.storage.local.set({ workflowStates: states });
  },
};

export const workflowLogger = new WorkflowLogger();
export const workflowState = new WorkflowState({
  storage: workflowStateStorage,
});

export function stopWorkflowExec(executionId) {
  workflowState.stop(executionId);
  sendMessage('workflow:stop', executionId, 'background');
}

export function startWorkflowExec(workflowData, options, isPopup = true) {
  if (self.localStorage) {
    const runCounts =
      parseJSON(self.localStorage.getItem('runCounts'), {}) || {};
    runCounts[workflowData.id] = (runCounts[workflowData.id] || 0) + 1;

    self.localStorage.setItem('runCounts', JSON.stringify(runCounts));
  }

  if (workflowData.testingMode) {
    for (const value of workflowState.states.values()) {
      if (value.workflowId === workflowData.id) return null;
    }
  }

  const clonedWorkflowData = {};
  Object.keys(workflowData).forEach((key) => {
    clonedWorkflowData[key] = toRaw(workflowData[key]);
  });

  const convertedWorkflow = convertWorkflowData(clonedWorkflowData);
  const engine = new WorkflowEngine(convertedWorkflow, {
    options,
    isPopup,
    states: workflowState,
    logger: workflowLogger,
    blocksHandler: blocksHandler(),
  });

  engine.init();
  engine.on('destroyed', ({ id, status, history, blockDetail, ...rest }) => {
    if (status !== 'stopped') {
      browser.permissions
        .contains({ permissions: ['notifications'] })
        .then((hasPermission) => {
          if (!hasPermission || !clonedWorkflowData.settings.notification)
            return;

          const name = clonedWorkflowData.name.slice(0, 32);

          browser.notifications.create(`logs:${id}`, {
            type: 'basic',
            iconUrl: browser.runtime.getURL('icon-128.png'),
            title: status === 'success' ? 'Success' : 'Error',
            message: `${
              status === 'success' ? 'Successfully' : 'Failed'
            } to run the "${name}" workflow`,
          });
        });
    }

    if (convertedWorkflow.settings?.events) {
      const workflowHistory = history.map((item) => {
        delete item.logId;
        delete item.prevBlockData;
        delete item.workerId;

        item.description = item.description || '';

        return item;
      });
      const workflowRefData = {
        status,
        startedAt: rest.startedTimestamp,
        endedAt: rest.endedTimestamp
          ? rest.endedTimestamp - rest.startedTimestamp
          : null,
        logs: workflowHistory,
        errorMessage: status === 'error' ? getBlockMessage(blockDetail) : null,
      };

      convertedWorkflow.settings.events.forEach((event) => {
        if (status === 'success' && !event.events.includes('finish:success'))
          return;
        if (status === 'error' && !event.events.includes('finish:failed'))
          return;

        workflowEventHandler(event.action, { workflow: workflowRefData });
      });
    }
  });

  browser.storage.local.get('checkStatus').then(({ checkStatus }) => {
    const isSameDay = dayjs().isSame(checkStatus, 'day');
    if (!isSameDay || !checkStatus) {
      fetchApi('/status')
        .then((response) => response.json())
        .then(() => {
          browser.storage.local.set({ checkStatus: new Date().toString() });
        });
    }
  });

  return engine;
}

export function executeWorkflow(workflowData, options) {
  if (!workflowData || workflowData.isDisabled) return;

  const isMV2 = browser.runtime.getManifest().manifest_version === 2;
  const context = workflowData?.settings?.execContext;

  if (isMV2 || context === 'background') {
    sendMessage('workflow:execute', { ...workflowData, options }, 'background');
    return;
  }

  if (window) window.fromBackground = false;

  browser.tabs
    .query({ active: true, currentWindow: true })
    .then(async ([tab]) => {
      if (tab && tab.url.includes(browser.runtime.getURL(''))) {
        await browser.windows.update(tab.windowId, { focused: false });
      }

      startWorkflowExec(workflowData, options);
    });
}

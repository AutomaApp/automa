import browser from 'webextension-polyfill';
import dayjs from 'dayjs';
import { findTriggerBlock, parseJSON } from '@/utils/helper';
import {
  registerCronJob,
  registerSpecificDay,
  registerWorkflowTrigger,
} from '@/utils/workflowTrigger';
import BackgroundUtils from './BackgroundUtils';
import BackgroundWorkflowUtils from './BackgroundWorkflowUtils';

async function executeWorkflow(workflowData, options) {
  if (workflowData.isDisabled) return;

  const isMV2 = browser.runtime.getManifest().manifest_version === 2;
  const context = workflowData.settings.execContext;
  if (isMV2 || context === 'background') {
    BackgroundWorkflowUtils.executeWorkflow(workflowData, options);
    return;
  }

  await BackgroundUtils.openDashboard('?fromBackground=true', false);
  await BackgroundUtils.sendMessageToDashboard('workflow:execute', {
    data: workflowData,
    options,
  });
}

class BackgroundWorkflowTriggers {
  static async visitWebTriggers(tabId, tabUrl, spa = false) {
    const { visitWebTriggers } = await browser.storage.local.get(
      'visitWebTriggers'
    );
    if (!visitWebTriggers || visitWebTriggers.length === 0) return;

    const triggeredWorkflow = visitWebTriggers.find(
      ({ url, isRegex, supportSPA }) => {
        if (!url.trim() || (spa && !supportSPA)) return false;

        return tabUrl.match(isRegex ? new RegExp(url, 'g') : url);
      }
    );

    if (triggeredWorkflow) {
      let workflowId = triggeredWorkflow.id;
      if (triggeredWorkflow.id.startsWith('trigger')) {
        const { 1: triggerWorkflowId } = triggeredWorkflow.id.split(':');
        workflowId = triggerWorkflowId;
      }

      const workflowData = await BackgroundWorkflowUtils.getWorkflow(
        workflowId
      );
      if (workflowData) executeWorkflow(workflowData, { tabId });
    }
  }

  static async scheduleWorkflow({ name }) {
    try {
      let workflowId = name;
      let triggerId = null;

      if (name.startsWith('trigger')) {
        const { 1: triggerWorkflowId, 2: triggerItemId } = name.split(':');
        triggerId = triggerItemId;
        workflowId = triggerWorkflowId;
      }

      const currentWorkflow = await BackgroundWorkflowUtils.getWorkflow(
        workflowId
      );
      if (!currentWorkflow) return;

      let data = currentWorkflow.trigger;
      if (!data) {
        const drawflow =
          typeof currentWorkflow.drawflow === 'string'
            ? parseJSON(currentWorkflow.drawflow, {})
            : currentWorkflow.drawflow;
        const { data: triggerBlockData } = findTriggerBlock(drawflow) || {};
        data = triggerBlockData;
      }

      if (triggerId) {
        data = data.triggers.find((trigger) => trigger.id === triggerId);
        if (data) data = { ...data, ...data.data };
      }

      if (data && data.type === 'interval' && data.fixedDelay) {
        const { workflowStates } = await browser.storage.local.get(
          'workflowStates'
        );
        const workflowState = (workflowStates || []).find(
          (item) => item.workflowId === workflowId
        );

        if (workflowState) {
          let { workflowQueue } = await browser.storage.local.get(
            'workflowQueue'
          );
          workflowQueue = workflowQueue || [];

          if (!workflowQueue.includes(workflowId)) {
            (workflowQueue = workflowQueue || []).push(workflowId);
            await browser.storage.local.set({ workflowQueue });
          }

          return;
        }
      } else if (data && data.type === 'date') {
        const [hour, minute, second] = data.time.split(':');
        const date = dayjs(data.date)
          .hour(hour)
          .minute(minute)
          .second(second || 0);

        const isAfter = dayjs(Date.now() - 60 * 1000).isAfter(date);
        if (isAfter) return;
      }

      executeWorkflow(currentWorkflow);

      if (!data) return;

      if (['specific-day', 'cron-job'].includes(data.type)) {
        if (data.type === 'specific-day') {
          registerSpecificDay(name, data);
        } else {
          registerCronJob(name, data);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  static async contextMenu({ parentMenuItemId, menuItemId, frameId }, tab) {
    try {
      if (parentMenuItemId !== 'automaContextMenu') return;
      const message = await browser.tabs.sendMessage(
        tab.id,
        {
          type: 'context-element',
        },
        { frameId }
      );

      let workflowId = menuItemId;
      if (menuItemId.startsWith('trigger')) {
        const { 1: triggerWorkflowId } = menuItemId.split(':');
        workflowId = triggerWorkflowId;
      }

      const workflowData = await BackgroundWorkflowUtils.getWorkflow(
        workflowId
      );
      executeWorkflow(workflowData, {
        data: {
          variables: message,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }

  static async reRegisterTriggers(isStartup = false) {
    const { workflows, workflowHosts, teamWorkflows } =
      await browser.storage.local.get([
        'workflows',
        'workflowHosts',
        'teamWorkflows',
      ]);
    const convertToArr = (value) =>
      Array.isArray(value) ? value : Object.values(value);

    const workflowsArr = convertToArr(workflows);

    if (workflowHosts) {
      workflowsArr.push(...convertToArr(workflowHosts));
    }
    if (teamWorkflows) {
      workflowsArr.push(
        ...BackgroundWorkflowUtils.flattenTeamWorkflows(teamWorkflows)
      );
    }

    for (const currWorkflow of workflowsArr) {
      let triggerBlock = currWorkflow.trigger;

      if (!triggerBlock) {
        const flow =
          typeof currWorkflow.drawflow === 'string'
            ? parseJSON(currWorkflow.drawflow, {})
            : currWorkflow.drawflow;

        triggerBlock = findTriggerBlock(flow)?.data;
      }

      if (triggerBlock) {
        if (isStartup && triggerBlock.type === 'on-startup') {
          executeWorkflow(currWorkflow);
        } else {
          if (isStartup && triggerBlock.triggers) {
            for (const trigger of triggerBlock.triggers) {
              if (trigger.type === 'on-startup') {
                await BackgroundWorkflowUtils.executeWorkflow(currWorkflow);
              }
            }
          }

          await registerWorkflowTrigger(currWorkflow.id, {
            data: triggerBlock,
          });
        }
      }
    }
  }
}

export default BackgroundWorkflowTriggers;

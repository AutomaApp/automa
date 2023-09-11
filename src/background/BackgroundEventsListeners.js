import browser from 'webextension-polyfill';
import { initElementSelector } from '@/newtab/utils/elementSelector';
import dayjs from 'dayjs';
import cronParser from 'cron-parser';
import BackgroundUtils from './BackgroundUtils';
import BackgroundWorkflowTriggers from './BackgroundWorkflowTriggers';

async function handleScheduleBackup() {
  try {
    const { scheduleLocalBackup, workflows } = await browser.storage.local.get([
      'scheduleLocalBackup',
      'workflows',
    ]);
    if (!scheduleLocalBackup) return;

    const workflowsData = Object.values(workflows || []).reduce(
      (acc, workflow) => {
        if (workflow.isProtected) return acc;

        delete workflow.$id;
        delete workflow.createdAt;
        delete workflow.data;
        delete workflow.isDisabled;
        delete workflow.isProtected;

        acc.push(workflow);

        return acc;
      },
      []
    );
    const base64 = btoa(JSON.stringify(workflowsData));
    const filename = `${
      scheduleLocalBackup.folderName ? `${scheduleLocalBackup.folderName}/` : ''
    }${dayjs().format('DD-MMM-YYYY--HH-mm')}.json`;

    await browser.downloads.download({
      filename,
      url: `data:application/json;base64,${base64}`,
    });
    await browser.storage.local.set({
      scheduleLocalBackup: {
        ...scheduleLocalBackup,
        lastBackup: Date.now(),
      },
    });

    const expression =
      scheduleLocalBackup.schedule === 'custom'
        ? scheduleLocalBackup.customSchedule
        : scheduleLocalBackup.schedule;
    const parsedExpression = cronParser.parseExpression(expression).next();
    if (!parsedExpression) return;

    await browser.alarms.create('schedule-local-backup', {
      when: parsedExpression.getTime(),
    });
  } catch (error) {
    console.error(error);
  }
}

class BackgroundEventsListeners {
  static onActionClicked() {
    BackgroundUtils.openDashboard();
  }

  static onCommand(name) {
    if (name === 'open-dashboard') {
      BackgroundUtils.openDashboard();
    } else if (name === 'element-picker') {
      initElementSelector();
    }
  }

  static onAlarms(event) {
    if (event.name === 'schedule-local-backup') {
      handleScheduleBackup();
      return;
    }

    BackgroundWorkflowTriggers.scheduleWorkflow(event);
  }

  static onWebNavigationCompleted({ tabId, url, frameId }) {
    if (frameId > 0) return;

    BackgroundWorkflowTriggers.visitWebTriggers(tabId, url);
  }

  static onContextMenuClicked(event, tab) {
    BackgroundWorkflowTriggers.contextMenu(event, tab);
  }

  static async onNotificationClicked(notificationId) {
    if (notificationId.startsWith('logs')) {
      const { 1: logId } = notificationId.split(':');

      const [tab] = await browser.tabs.query({
        url: browser.runtime.getURL('/newtab.html'),
      });
      if (!tab) await BackgroundUtils.openDashboard('');

      await BackgroundUtils.sendMessageToDashboard('open-logs', { logId });
    }
  }

  static onRuntimeStartup() {
    browser.storage.local.remove('workflowStates');
    (browser.action || browser.browserAction).setBadgeText({ text: '' });
    BackgroundWorkflowTriggers.reRegisterTriggers(true);
  }

  static onHistoryStateUpdated({ frameId, url, tabId }) {
    if (frameId !== 0) return;

    BackgroundWorkflowTriggers.visitWebTriggers(tabId, url, true);
  }

  static async onRuntimeInstalled({ reason }) {
    try {
      if (reason === 'install') {
        await browser.storage.local.set({
          logs: [],
          shortcuts: {},
          workflows: [],
          collections: [],
          workflowState: {},
          isFirstTime: true,
          visitWebTriggers: [],
        });
        await browser.windows.create({
          type: 'popup',
          state: 'maximized',
          url: browser.runtime.getURL('newtab.html#/welcome'),
        });

        return;
      }

      if (reason === 'update') {
        await BackgroundWorkflowTriggers.reRegisterTriggers();
      }
    } catch (error) {
      console.error(error);
    }
  }
}

export default BackgroundEventsListeners;

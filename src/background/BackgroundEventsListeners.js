import browser from 'webextension-polyfill';
import BackgroundUtils from './BackgroundUtils';
import BackgroundWorkflowTriggers from './BackgroundWorkflowTriggers';

class BackgroundEventsListeners {
  static onActionClicked() {
    BackgroundUtils.openDashboard();
  }

  static onCommand(name) {
    if (name === 'open-dashboard') BackgroundUtils.openDashboard();
  }

  static onAlarms(event) {
    BackgroundWorkflowTriggers.scheduleWorkflow(event);
  }

  static onHistoryStateUpdated({ tabId, url, frameId }) {
    if (frameId > 0) return;

    BackgroundWorkflowTriggers.visitWebTriggers(tabId, url);
  }

  static onContextMenuClicked(event, tab) {
    BackgroundWorkflowTriggers.contextMenu(event, tab);
  }

  static onNotificationClicked(notificationId) {
    if (notificationId.startsWith('logs')) {
      const { 1: logId } = notificationId.split(':');
      BackgroundUtils.openDashboard(`/logs/${logId}`);
    }
  }

  static onRuntimeStartup() {
    BackgroundWorkflowTriggers.reRegisterTriggers(true);
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

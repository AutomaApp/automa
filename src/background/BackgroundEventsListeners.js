import browser from 'webextension-polyfill';
import BackgroundUtils from './BackgroundUtils';
import BackgroundRecordWorkflow from './BackgroundRecordWorkflow';
import BackgroundWorkflowTriggers from './BackgroundWorkflowTriggers';

const validateUrl = (str) => str?.startsWith('http');

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

  static onWebNavigationCompleted({ tabId, url, frameId }) {
    if (frameId > 0) return;

    BackgroundRecordWorkflow.checkRecording(tabId, url);
    BackgroundWorkflowTriggers.visitWebTriggers(tabId, url);
  }

  static onContextMenuClicked(event, tab) {
    BackgroundWorkflowTriggers.contextMenu(event, tab);
  }

  static async onTabCreated(tab) {
    const { isRecording, recording } = await browser.storage.local.get([
      'isRecording',
      'recording',
    ]);

    if (!isRecording || !recording) return;

    const url = tab.url || tab.pendingUrl;
    const lastFlow = recording.flows[recording.flows.length - 1];
    const invalidPrevFlow =
      lastFlow && lastFlow.id === 'new-tab' && !validateUrl(lastFlow.data.url);

    if (!invalidPrevFlow) {
      const validUrl = validateUrl(url) ? url : '';

      recording.flows.push({
        id: 'new-tab',
        data: {
          url: validUrl,
          description: tab.title || validUrl,
        },
      });
    }

    recording.activeTab = {
      url,
      id: tab.id,
    };

    await browser.storage.local.set({ recording });
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
        await browser.tabs.create({
          active: true,
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

  static async onTabsActivated({ tabId }) {
    const { url, id, title } = await browser.tabs.get(tabId);

    if (!validateUrl(url)) return;

    BackgroundRecordWorkflow.updateRecording((recording) => {
      recording.activeTab = { id, url };
      recording.flows.push({
        id: 'switch-tab',
        description: title,
        data: {
          url,
          matchPattern: url,
          createIfNoMatch: true,
        },
      });
    });
  }

  static onWebNavigationCommited({ frameId, tabId, url, transitionType }) {
    const allowedType = ['link', 'typed'];
    if (frameId !== 0 || !allowedType.includes(transitionType)) return;

    BackgroundRecordWorkflow.updateRecording((recording) => {
      if (tabId !== recording.activeTab.id) return;

      const lastFlow = recording.flows.at(-1) ?? {};
      const isInvalidNewtabFlow =
        lastFlow &&
        lastFlow.id === 'new-tab' &&
        !validateUrl(lastFlow.data.url);

      if (isInvalidNewtabFlow) {
        lastFlow.data.url = url;
        lastFlow.description = url;
      } else if (validateUrl(url)) {
        if (lastFlow?.id !== 'link' || !lastFlow.isClickLink) {
          recording.flows.push({
            id: 'new-tab',
            description: url,
            data: {
              url,
              updatePrevTab: recording.activeTab.id === tabId,
            },
          });
        }

        recording.activeTab.id = tabId;
        recording.activeTab.url = url;
      }
    });
  }
}

export default BackgroundEventsListeners;

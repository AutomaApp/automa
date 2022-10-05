import browser from 'webextension-polyfill';

const validateUrl = (str) => str?.startsWith('http');

class RecordWorkflowUtils {
  static async updateRecording(callback) {
    const { isRecording, recording } = await browser.storage.local.get([
      'isRecording',
      'recording',
    ]);

    if (!isRecording || !recording) return;

    callback(recording);

    await browser.storage.local.set({ recording });
  }

  static onTabCreated(tab) {
    this.updateRecording((recording) => {
      const url = tab.url || tab.pendingUrl;
      const lastFlow = recording.flows[recording.flows.length - 1];
      const invalidPrevFlow =
        lastFlow &&
        lastFlow.id === 'new-tab' &&
        !validateUrl(lastFlow.data.url);

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

      browser.storage.local.set({ recording });
    });
  }

  static async onTabsActivated({ tabId }) {
    const { url, id, title } = await browser.tabs.get(tabId);

    if (!validateUrl(url)) return;

    this.updateRecording((recording) => {
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

    this.updateRecording((recording) => {
      if (recording.activeTab.id && tabId !== recording.activeTab.id) return;

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

  static async onWebNavigationCompleted({ tabId, url, frameId }) {
    if (frameId > 0 || !url.startsWith('http')) return;

    try {
      const { isRecording } = await browser.storage.local.get('isRecording');
      if (!isRecording) return;

      await browser.scripting.executeScript({
        target: {
          tabId,
          allFrames: true,
        },
        files: ['recordWorkflow.bundle.js'],
      });
    } catch (error) {
      console.error(error);
    }
  }
}

export default RecordWorkflowUtils;

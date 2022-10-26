import browser from 'webextension-polyfill';

const isMV2 = browser.runtime.getManifest().manifest_version === 2;

export default async function (options = {}) {
  try {
    const flows = [];
    const [activeTab] = await browser.tabs.query({
      active: true,
      url: '*://*/*',
    });

    if (activeTab && activeTab.url.startsWith('http')) {
      flows.push({
        id: 'new-tab',
        description: activeTab.url,
        data: { url: activeTab.url },
      });

      await browser.windows.update(activeTab.windowId, { focused: true });
    }

    await browser.storage.local.set({
      isRecording: true,
      recording: {
        flows,
        name: 'unnamed',
        activeTab: {
          id: activeTab?.id,
          url: activeTab?.url,
        },
        ...options,
      },
    });

    const action = browser.action || browser.browserAction;
    await action.setBadgeBackgroundColor({ color: '#ef4444' });
    await action.setBadgeText({ text: 'rec' });

    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      if (
        tab.url.startsWith('http') &&
        !tab.url.includes('chrome.google.com')
      ) {
        if (isMV2) {
          await browser.tabs.executeScript(tab.id, {
            allFrames: true,
            runAt: 'document_start',
            file: './recordWorkflow.bundle.js',
          });
        } else {
          await browser.scripting.executeScript({
            target: {
              tabId: tab.id,
              allFrames: true,
            },
            files: ['recordWorkflow.bundle.js'],
          });
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}

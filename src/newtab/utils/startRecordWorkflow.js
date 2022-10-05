import browser from 'webextension-polyfill';

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
    await browser.action.setBadgeBackgroundColor({ color: '#ef4444' });
    await browser.action.setBadgeText({ text: 'rec' });

    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      if (
        tab.url.startsWith('http') &&
        !tab.url.includes('chrome.google.com')
      ) {
        await browser.scripting.executeScript({
          target: {
            tabId: tab.id,
            allFrames: true,
          },
          files: ['recordWorkflow.bundle.js'],
        });
      }
    }
  } catch (error) {
    console.error(error);
  }
}

import browser from 'webextension-polyfill';

async function initElementSelector(tab = null) {
  let activeTab = tab;

  if (!tab) {
    const [queryTab] = await browser.tabs.query({
      active: true,
      url: '*://*/*',
    });
    activeTab = queryTab;
  }

  const result = await browser.tabs.sendMessage(activeTab.id, {
    type: 'automa-element-selector',
  });

  if (!result) {
    await browser.scripting.executeScript({
      target: {
        allFrames: true,
        tabId: activeTab.id,
      },
      files: ['./elementSelector.bundle.js'],
    });
  }

  await browser.tabs.update(activeTab.id, { active: true });
  await browser.windows.update(activeTab.windowId, { focused: true });
}

export function verifySelector() {}

export async function selectElement(name) {
  const [tab] = await browser.tabs.query({
    active: true,
    url: '*://*/*',
  });
  if (!tab) throw new Error('No active tab');

  await initElementSelector(tab);

  const port = await browser.tabs.connect(tab.id, { name });
  const getSelector = () => {
    return new Promise((resolve, reject) => {
      port.onDisconnect.addListener(() => {
        reject(new Error('Port closed'));
      });
      port.onMessage.addListener(async (message) => {
        try {
          const [currentTab] = await browser.tabs.query({
            active: true,
            currentWindow: true,
          });
          await browser.windows.update(currentTab.windowId, {
            focused: true,
          });
        } catch (error) {
          console.error(error);
        } finally {
          resolve(message);
        }
      });
    });
  };

  const selector = await getSelector();

  return selector;
}

export default {
  selectElement,
  verifySelector,
};

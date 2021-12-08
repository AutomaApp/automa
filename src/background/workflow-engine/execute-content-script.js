import browser from 'webextension-polyfill';

function getFrames(tabId) {
  return new Promise((resolve) => {
    const frames = {};
    let frameTimeout;
    let timeout;

    const onMessageListener = (_, sender) => {
      if (sender.frameId !== 0) frames[sender.url] = sender.frameId;

      clearTimeout(frameTimeout);
      frameTimeout = setTimeout(() => {
        clearTimeout(timeout);
        browser.runtime.onMessage.removeListener(onMessageListener);
        resolve(frames);
      }, 250);
    };

    browser.tabs.sendMessage(tabId, {
      type: 'give-me-the-frame-id',
    });
    browser.runtime.onMessage.addListener(onMessageListener);

    timeout = setTimeout(() => {
      clearTimeout(frameTimeout);
      resolve(frames);
    }, 5000);
  });
}

async function contentScriptExist(tabId) {
  try {
    await browser.tabs.sendMessage(tabId, { type: 'content-script-exists' });

    return true;
  } catch (error) {
    return false;
  }
}

export default async function (tabId) {
  try {
    const isScriptExists = await contentScriptExist(tabId);

    if (!isScriptExists) {
      await browser.tabs.executeScript(tabId, {
        file: './contentScript.bundle.js',
        allFrames: true,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const frames = await getFrames(tabId);

    return frames;
  } catch (error) {
    console.error(error);
    return {};
  }
}

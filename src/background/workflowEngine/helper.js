import browser from 'webextension-polyfill';

export async function getFrames(tabId) {
  try {
    const frames = await browser.webNavigation.getAllFrames({ tabId });
    const framesObj = frames.reduce((acc, { frameId, url }) => {
      const key = url === 'about:blank' ? '' : url;

      acc[key] = frameId;

      return acc;
    }, {});

    return framesObj;
  } catch (error) {
    console.error(error);
    return {};
  }
}

export function sendDebugCommand(tabId, method, params = {}) {
  return new Promise((resolve) => {
    chrome.debugger.sendCommand({ tabId }, method, params, resolve);
  });
}

export function attachDebugger(tabId, prevTab) {
  return new Promise((resolve) => {
    if (prevTab && tabId !== prevTab)
      chrome.debugger.detach({ tabId: prevTab });

    chrome.debugger.attach({ tabId }, '1.3', () => {
      chrome.debugger.sendCommand({ tabId }, 'Page.enable', resolve);
    });
  });
}

export function waitTabLoaded(tabId, ms = 10000) {
  return new Promise((resolve, reject) => {
    const excludeErrors = ['net::ERR_BLOCKED_BY_CLIENT', 'net::ERR_ABORTED'];

    const onErrorOccurred = (details) => {
      if (
        details.tabId !== tabId ||
        details.frameId !== 0 ||
        !excludeErrors.includes(details.error)
      )
        return;

      browser.webNavigation.onErrorOccurred.removeListener(onErrorOccurred);
      reject(new Error(details.error));
    };

    if (ms > 0) {
      timeout = setTimeout(() => {
        browser.webNavigation.onErrorOccurred.removeListener(onErrorOccurred);
        reject(new Error('Timeout'));
      }, ms);
    }

    browser.webNavigation.onErrorOccurred.addListener(onErrorOccurred);

    const activeTabStatus = () => {
      browser.tabs.get(tabId).then((tab) => {
        if (!tab) {
          reject(new Error('no-tab'));
          return;
        }

        if (tab.status === 'loading') {
          setTimeout(() => {
            activeTabStatus();
          }, 1000);
          return;
        }

        clearTimeout(timeout);

        browser.webNavigation.onErrorOccurred.removeListener(onErrorOccurred);
        resolve();
      });
    };

    activeTabStatus();
  });
}

export function convertData(data, type) {
  if (type === 'any') return data;

  let result = data;

  switch (type) {
    case 'integer':
      result = typeof data !== 'number' ? +data?.replace(/\D+/g, '') : data;
      break;
    case 'boolean':
      result = Boolean(data);
      break;
    case 'array':
      result = Array.from(data);
      break;
    case 'string':
      result = String(data);
      break;
    default:
  }

  return result;
}

export function getBlockConnection(block, index = 1) {
  const blockId = block.outputs[`output_${index}`];

  return blockId;
}

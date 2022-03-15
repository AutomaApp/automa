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

export function waitTabLoaded(tabId) {
  return new Promise((resolve, reject) => {
    const activeTabStatus = () => {
      chrome.tabs.get(tabId, (tab) => {
        if (!tab) {
          reject(new Error('no-tab'));
          return;
        }

        if (tab.status === 'loading') {
          setTimeout(() => {
            activeTabStatus();
          }, 500);
          return;
        }

        resolve();
      });
    };

    activeTabStatus();
  });
}

export function convertData(data, type) {
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
    default:
  }

  return result;
}

export function getBlockConnection(block, index = 1) {
  const blockId = block.outputs[`output_${index}`]?.connections[0]?.node;

  return blockId;
}

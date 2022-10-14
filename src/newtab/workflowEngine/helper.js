import browser from 'webextension-polyfill';
import { customAlphabet } from 'nanoid/non-secure';

export function messageSandbox(type, data = {}) {
  const nanoid = customAlphabet('1234567890abcdef', 5);

  return new Promise((resolve) => {
    const messageId = nanoid();

    const iframeEl = document.getElementById('sandbox');
    iframeEl.contentWindow.postMessage({ id: messageId, type, ...data }, '*');

    const messageListener = ({ data: messageData }) => {
      if (messageData?.type !== 'sandbox' || messageData?.id !== messageId)
        return;

      window.removeEventListener('message', messageListener);

      resolve(messageData.result);
    };

    window.addEventListener('message', messageListener);
  });
}

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

    chrome.debugger.getTargets((targets) => {
      targets.forEach((target) => {
        if (target.attached || target.tabId !== tabId) {
          resolve();
          return;
        }

        chrome.debugger.attach({ tabId }, '1.3', () => {
          chrome.debugger.sendCommand({ tabId }, 'Page.enable', resolve);
        });
      });
    });
  });
}

export function waitTabLoaded({ tabId, listenError = false, ms = 10000 }) {
  return new Promise((resolve, reject) => {
    let timeout = null;
    const excludeErrors = ['net::ERR_BLOCKED_BY_CLIENT', 'net::ERR_ABORTED'];

    const onErrorOccurred = (details) => {
      if (
        details.tabId !== tabId ||
        details.frameId !== 0 ||
        excludeErrors.includes(details.error)
      )
        return;

      clearTimeout(timeout);
      browser.webNavigation.onErrorOccurred.removeListener(onErrorOccurred);
      reject(new Error(details.error));
    };

    if (ms > 0) {
      timeout = setTimeout(() => {
        browser.webNavigation.onErrorOccurred.removeListener(onErrorOccurred);
        reject(new Error('Timeout'));
      }, ms);
    }
    if (listenError && BROWSER_TYPE === 'chrome')
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
      /* eslint-disable-next-line */
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

export function automaRefDataStr(varName) {
  return `
function findData(obj, path) {
  const paths = path.split('.');
  const isWhitespace = paths.length === 1 && !/\\S/.test(paths[0]);

  if (path.startsWith('$last') && Array.isArray(obj)) {
    paths[0] = obj.length - 1;
  }

  if (paths.length === 0 || isWhitespace) return obj;
  else if (paths.length === 1) return obj[paths[0]];

  let result = obj;

  for (let i = 0; i < paths.length; i++) {
    if (result[paths[i]] == undefined) {
      return undefined;
    } else {
      result = result[paths[i]];
    }
  }

  return result;
}
function automaRefData(keyword, path = '') {
  const data = ${varName}[keyword];

  if (!data) return;

  return findData(data, path);
}
  `;
}

export function injectPreloadScript({ target, scripts, frameSelector }) {
  return browser.scripting.executeScript({
    target,
    world: 'MAIN',
    args: [scripts, frameSelector || null],
    func: (preloadScripts, frame) => {
      let $documentCtx = document;

      if (frame) {
        const iframeCtx = document.querySelector(frame)?.contentDocument;
        if (!iframeCtx) return;

        $documentCtx = iframeCtx;
      }

      preloadScripts.forEach((script) => {
        const scriptAttr = `block--${script.id}`;

        const isScriptExists = $documentCtx.querySelector(
          `.automa-custom-js[${scriptAttr}]`
        );

        if (isScriptExists) return;

        const scriptEl = $documentCtx.createElement('script');
        scriptEl.textContent = script.data.code;
        scriptEl.setAttribute(scriptAttr, '');
        scriptEl.classList.add('automa-custom-js');

        $documentCtx.documentElement.appendChild(scriptEl);
      });
    },
  });
}

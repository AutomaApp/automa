import BrowserAPIService from '@/service/browser-api/BrowserAPIService';
import { MessageListener } from '@/utils/message';
import { customAlphabet } from 'nanoid/non-secure';
import browser from 'webextension-polyfill';

export function escapeElementPolicy(script) {
  if (window?.trustedTypes?.createPolicy) {
    const escapePolicy = window.trustedTypes.createPolicy('forceInner', {
      createHTML: (to_escape) => to_escape,
      createScript: (to_escape) => to_escape,
    });

    return escapePolicy.createScript(script);
  }

  return script;
}

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
    const frames = await BrowserAPIService.webNavigation.getAllFrames({
      tabId,
    });
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
    BrowserAPIService.debugger.sendCommand({ tabId }, method, params, resolve);
  });
}

export async function attachDebugger(tabId, prevTab) {
  try {
    if (prevTab && tabId !== prevTab) {
      await BrowserAPIService.debugger.detach({ tabId: prevTab });
    }

    // first attach
    await BrowserAPIService.debugger.attach({ tabId }, '1.3');

    // and then Page.enable
    await BrowserAPIService.debugger.sendCommand({ tabId }, 'Page.enable');

    return true;
  } catch (error) {
    console.error('Failed to attach debugger:', error);
    return false;
  }
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
      BrowserAPIService.webNavigation.onErrorOccurred.removeListener(
        onErrorOccurred
      );
      reject(new Error(details.error));
    };

    if (ms > 0) {
      timeout = setTimeout(() => {
        BrowserAPIService.webNavigation.onErrorOccurred.removeListener(
          onErrorOccurred
        );
        reject(new Error('Timeout'));
      }, ms);
    }
    if (listenError && BROWSER_TYPE === 'chrome')
      BrowserAPIService.webNavigation.onErrorOccurred.addListener(
        onErrorOccurred
      );

    const activeTabStatus = async () => {
      const tab = await BrowserAPIService.tabs.get(tabId);
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

      BrowserAPIService.webNavigation.onErrorOccurred.removeListener(
        onErrorOccurred
      );
      resolve();
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

export async function checkCSPAndInject(
  { target, debugMode, options = {}, injectOptions = {} },
  callback
) {
  try {
    const result = await MessageListener.sendMessage(
      'check-csp-and-inject',
      {
        target,
        debugMode,
        callback: callback.toString(),
        options,
        injectOptions,
      },
      'background'
    );
    return result;
  } catch (err) {
    return { isBlocked: true, value: null };
  }
}

function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.position = 'fixed';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}

export function copyTextToClipboard(text) {
  return new Promise((resolve, reject) => {
    if (!navigator.clipboard) {
      fallbackCopyTextToClipboard(text);
      resolve(true);
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => {
        resolve(true);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

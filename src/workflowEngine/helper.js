import BrowserAPIService from '@/service/browser-api/BrowserAPIService';
import { MessageListener } from '@/utils/message';
import { customAlphabet } from 'nanoid/non-secure';
import browser from 'webextension-polyfill';

export function escapeElementPolicy(script) {
  if (window?.trustedTypes?.createPolicy) {
    try {
      // 尝试使用可能在CSP白名单中的名称
      const policyNames = ['default', 'dompurify', 'jSecure', 'forceInner'];
      let escapePolicy = null;

      // 尝试创建策略，如果一个名称失败，尝试下一个
      for (const policyName of policyNames) {
        try {
          escapePolicy = window.trustedTypes.createPolicy(policyName, {
            createHTML: (to_escape) => to_escape,
            createScript: (to_escape) => to_escape,
          });
          // 如果成功创建，跳出循环
          break;
        } catch (e) {
          // 该名称失败，继续尝试下一个
          console.debug(`Policy name ${policyName} failed, trying next one`);
        }
      }

      // 如果成功创建了策略，使用它
      if (escapePolicy) {
        return escapePolicy.createScript(script);
      }
      // 如果所有策略名称都失败，返回原始脚本
      console.debug(
        'All trusted policy creation attempts failed, falling back to raw script'
      );
      return script;
    } catch (e) {
      // 捕获任何其他错误并降级
      console.debug('Error creating trusted policy:', e);
      return script;
    }
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

    const activeTabStatus = () => {
      BrowserAPIService.tabs.get(tabId).then((tab) => {
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

export async function checkCSPAndInject(
  { target, debugMode, options = {}, injectOptions = {} },
  callback
) {
  let _callback = '';
  if (typeof callback === 'function') {
    _callback = callback.toString();
  } else if (typeof callback === 'string') {
    _callback = callback;
  }

  try {
    const result = await MessageListener.sendMessage(
      'check-csp-and-inject',
      {
        target,
        debugMode,
        callback: _callback,
        options,
        injectOptions,
      },
      'background'
    );

    return result;
  } catch (error) {
    console.error('CSP check error:', error);
    return { isBlocked: false, value: null };
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

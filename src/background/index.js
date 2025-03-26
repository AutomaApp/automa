import { IS_FIREFOX } from '@/common/utils/constant';
import BrowserAPIEventHandler from '@/service/browser-api/BrowserAPIEventHandler';
import BrowserAPIService from '@/service/browser-api/BrowserAPIService';
import { useUserStore } from '@/stores/user';
import getFile, { readFileAsBase64 } from '@/utils/getFile';
import { sleep } from '@/utils/helper';
import { MessageListener } from '@/utils/message';

// import { getDocumentCtx } from '@/content/handleSelector';
import { automaRefDataStr } from '@/workflowEngine/helper';

import automa from '@business';
import browser from 'webextension-polyfill';
import { registerWorkflowTrigger } from '../utils/workflowTrigger';
import BackgroundEventsListeners from './BackgroundEventsListeners';
import BackgroundOffscreen from './BackgroundOffscreen';
import BackgroundUtils from './BackgroundUtils';
import BackgroundWorkflowUtils from './BackgroundWorkflowUtils';

BackgroundOffscreen.instance.sendMessage('halo');

browser.alarms.onAlarm.addListener(BackgroundEventsListeners.onAlarms);

browser.commands.onCommand.addListener(BackgroundEventsListeners.onCommand);

(browser.action || browser.browserAction).onClicked.addListener(
  BackgroundEventsListeners.onActionClicked
);

browser.runtime.onStartup.addListener(
  BackgroundEventsListeners.onRuntimeStartup
);
browser.runtime.onInstalled.addListener(
  BackgroundEventsListeners.onRuntimeInstalled
);

browser.webNavigation.onCompleted.addListener(
  BackgroundEventsListeners.onWebNavigationCompleted
);
browser.webNavigation.onHistoryStateUpdated.addListener(
  BackgroundEventsListeners.onHistoryStateUpdated
);

const contextMenu = IS_FIREFOX ? browser.menus : browser.contextMenus;
if (contextMenu && contextMenu.onClicked) {
  contextMenu.onClicked.addListener(
    BackgroundEventsListeners.onContextMenuClicked
  );
}

if (browser.notifications && browser.notifications.onClicked) {
  browser.notifications.onClicked.addListener(
    BackgroundEventsListeners.onNotificationClicked
  );
}

const message = new MessageListener('background');

message.on('browser-api', (payload) => {
  return BrowserAPIService.runtimeMessageHandler(payload);
});
message.on(BrowserAPIEventHandler.RuntimeEvents.TOGGLE, (data) =>
  BrowserAPIEventHandler.instance.onToggleBrowserEventListener(data)
);

message.on('fetch', async ({ type, resource }) => {
  const response = await fetch(resource.url, resource);
  if (!response.ok) throw new Error(response.statusText);

  let result = null;

  if (type === 'base64') {
    const blob = await response.blob();
    const base64 = await readFileAsBase64(blob);

    result = base64;
  } else {
    result = await response[type]();
  }

  return result;
});
message.on('fetch:text', (url) => {
  return fetch(url).then((response) => response.text());
});

message.on('open:dashboard', (url) => BackgroundUtils.openDashboard(url));
message.on('set:active-tab', (tabId) => {
  return browser.tabs.update(tabId, { active: true });
});

message.on('debugger:send-command', ({ tabId, method, params }) => {
  return new Promise((resolve) => {
    chrome.debugger.sendCommand({ tabId }, method, params, resolve);
  });
});
message.on('debugger:type', ({ tabId, commands, delay }) => {
  return new Promise((resolve) => {
    let index = 0;
    async function executeCommands() {
      const command = commands[index];
      if (!command) {
        resolve();
        return;
      }

      chrome.debugger.sendCommand(
        { tabId },
        'Input.dispatchKeyEvent',
        command,
        async () => {
          if (delay > 0) await sleep(delay);

          index += 1;
          executeCommands();
        }
      );
    }
    executeCommands();
  });
});

message.on('get:sender', (_, sender) => sender);
message.on('get:file', (path) => getFile(path));
message.on('get:tab-screenshot', (options, sender) =>
  browser.tabs.captureVisibleTab(sender.tab.windowId, options)
);

message.on('dashboard:refresh-packages', async () => {
  const tabs = await browser.tabs.query({
    url: browser.runtime.getURL('/newtab.html'),
  });

  tabs.forEach((tab) => {
    browser.tabs.sendMessage(tab.id, {
      type: 'refresh-packages',
    });
  });
});

message.on('workflow:stop', (stateId) =>
  BackgroundWorkflowUtils.instance.stopExecution(stateId)
);
message.on('workflow:execute', async (workflowData, sender) => {
  if (workflowData.includeTabId) {
    if (!workflowData.options) workflowData.options = {};
    workflowData.options.tabId = sender.tab.id;
  }

  BackgroundWorkflowUtils.instance.executeWorkflow(
    workflowData,
    workflowData?.options || {}
  );
});
message.on(
  'workflow:added',
  ({ workflowId, teamId, workflowData, source = 'community' }) => {
    let path = `/workflows/${workflowId}`;

    if (source === 'team') {
      if (!teamId) return;
      path = `/teams/${teamId}/workflows/${workflowId}`;
    }

    browser.tabs
      .query({ url: browser.runtime.getURL('/newtab.html') })
      .then((tabs) => {
        if (tabs.length >= 1) {
          const lastTab = tabs.at(-1);

          tabs.forEach((tab) => {
            browser.tabs.sendMessage(tab.id, {
              data: { workflowId, teamId, source, workflowData },
              type: 'workflow:added',
            });
          });

          browser.tabs.update(lastTab.id, {
            active: true,
          });
          browser.windows.update(lastTab.windowId, { focused: true });
        } else {
          BackgroundUtils.openDashboard(`${path}?permission=true`);
        }
      });
  }
);
message.on('workflow:register', ({ triggerBlock, workflowId }) => {
  registerWorkflowTrigger(workflowId, triggerBlock);
});
message.on('recording:stop', async () => {
  try {
    await BackgroundUtils.openDashboard('', false);
    await BackgroundUtils.sendMessageToDashboard('recording:stop');
  } catch (error) {
    console.error(error);
  }
});
message.on('workflow:resume', ({ id, nextBlock }) => {
  if (!id) return;
  BackgroundWorkflowUtils.instance.resumeExecution(id, nextBlock);
});
message.on('workflow:breakpoint', (id) => {
  if (!id) return;
  BackgroundWorkflowUtils.instance.updateExecutionState(id, {
    status: 'breakpoint',
  });
});

message.on('get:user-id', async () => {
  const userStore = useUserStore();
  return { userId: userStore.user?.id };
});

message.on(
  'check-csp-and-inject',
  async ({ target, debugMode, callback, options, injectOptions }) => {
    try {
      const [isBlockedByCSP] = await browser.scripting.executeScript({
        target,
        // eslint-disable-next-line object-shorthand
        func: function () {
          return new Promise((resolve) => {
            const escapePolicy = (script) => {
              if (window?.trustedTypes?.createPolicy) {
                try {
                  // 尝试使用可能在CSP白名单中的名称
                  const policyNames = [
                    'default',
                    'dompurify',
                    'jSecure',
                    'forceInner',
                  ];
                  let escapeElPolicy = null;

                  // 尝试创建策略，如果一个名称失败，尝试下一个
                  for (const policyName of policyNames) {
                    try {
                      escapeElPolicy = window.trustedTypes.createPolicy(
                        policyName,
                        {
                          createHTML: (to_escape) => to_escape,
                          createScript: (to_escape) => to_escape,
                        }
                      );
                      // 如果成功创建，跳出循环
                      break;
                    } catch (e) {
                      // 该名称失败，继续尝试下一个
                      console.debug(
                        `Policy name ${policyName} failed, trying next one`
                      );
                    }
                  }

                  // 如果成功创建了策略，使用它
                  if (escapeElPolicy) {
                    return escapeElPolicy.createScript(script);
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
            };

            const eventListener = ({ srcElement }) => {
              if (!srcElement || srcElement.id !== 'automa-csp') return;
              srcElement.remove();
              resolve(true);
            };

            document.addEventListener('securitypolicyviolation', eventListener);
            const script = document.createElement('script');
            script.id = 'automa-csp';
            script.innerText = escapePolicy('console.log("...")');

            setTimeout(() => {
              document.removeEventListener(
                'securitypolicyviolation',
                eventListener
              );
              resolve(false);
            }, 500);

            document.body.appendChild(script);
          });
        },
        world: 'MAIN',
        ...injectOptions,
      });

      // CSP blocked
      if (isBlockedByCSP.result) {
        await new Promise((resolve) => {
          chrome.debugger.attach({ tabId: target.tabId }, '1.3', resolve);
        });

        // 首先执行回调函数以获取JS代码字符串
        // 这里的关键是回调函数本身就是一个字符串，直接在debugger中执行
        const callbackString =
          typeof callback === 'function' ? callback.toString() : callback;

        if (!callbackString) {
          throw new Error('Callback is missing or invalid');
        }

        // 直接执行回调函数的字符串表示，不再通过额外的包装函数
        const wrappedCallback = `
          (function() {
            try {
              const fn = ${callbackString};
              return fn();
            } catch (err) {
              console.error("Error in callback execution:", err);
              return JSON.stringify({ error: err.message });
            }
          })()
        `;

        // 执行回调函数以获取JavaScript代码
        const jsCodeResult = await chrome.debugger.sendCommand(
          { tabId: target.tabId },
          'Runtime.evaluate',
          {
            expression: wrappedCallback,
            userGesture: true,
            returnByValue: true,
            ...options,
          }
        );

        if (!jsCodeResult || !jsCodeResult.result) {
          console.error('无法获取JavaScript代码，结果为空');
          throw new Error('Unable to get JavaScript code');
        }

        if (
          jsCodeResult.result.subtype === 'error' ||
          jsCodeResult.exceptionDetails
        ) {
          console.error(
            '执行回调函数时出错:',
            jsCodeResult.result.description || jsCodeResult.exceptionDetails
          );
          throw new Error(
            jsCodeResult.result.description || 'Error executing callback'
          );
        }

        // 确保我们获取到的是字符串类型的JavaScript代码
        if (typeof jsCodeResult.result.value !== 'string') {
          console.error('回调函数返回的不是JavaScript代码字符串');
          throw new Error('Callback did not return JavaScript code string');
        }

        const jsCode = jsCodeResult.result.value;

        // 执行生成的JavaScript代码
        const execResult = await chrome.debugger.sendCommand(
          { tabId: target.tabId },
          'Runtime.evaluate',
          {
            expression: jsCode,
            userGesture: true,
            awaitPromise: true,
            returnByValue: true,
            ...options,
          }
        );

        if (!debugMode) {
          await chrome.debugger.detach({ tabId: target.tabId });
        }

        if (!execResult || !execResult.result) {
          console.error('无法执行代码，结果为空');
          throw new Error('Unable execute code');
        }

        if (
          execResult.result.subtype === 'error' ||
          execResult.exceptionDetails
        ) {
          console.error(
            '执行JavaScript代码时出错:',
            execResult.result.description || execResult.exceptionDetails
          );
          throw new Error(
            execResult.result.description || 'Error executing JavaScript code'
          );
        }

        return {
          isBlocked: true,
          value: execResult.result.value || null,
        };
      }

      return { isBlocked: false };
    } catch (error) {
      console.error(error);
      return { isBlocked: false, error: error.message };
    }
  }
);

const getAutomaScript = ({ varName, refData, everyNewTab, isEval = false }) => {
  let str = `
const ${varName} = ${JSON.stringify(refData)};
${automaRefDataStr(varName)}
function automaSetVariable(name, value) {
  const variables = ${varName}.variables;
  if (!variables) ${varName}.variables = {}

  ${varName}.variables[name] = value;
}
function automaNextBlock(data, insert = true) {
  if (${isEval}) {
    Promise.resolve({
      columns: {
        data,
        insert,
      },
      variables: ${varName}.variables,
    });
  } else{
    document.body.dispatchEvent(new CustomEvent('__automa-next-block__', { detail: { data, insert, refData: ${varName} } }));
  }
}
function automaResetTimeout() {
  if (${isEval}) {
    clearTimeout($automaTimeout);
    $automaTimeout = setTimeout(() => {
      resolve();
    }, $automaTimeoutMs);
  } else {
    document.body.dispatchEvent(new CustomEvent('__automa-reset-timeout__'));
  }
}

function automaFetchClient(id, { type, resource }) {
  return new Promise((resolve, reject) => {
    const validType = ['text', 'json', 'base64'];
    if (!type || !validType.includes(type)) {
      reject(new Error('The "type" must be "text" or "json"'));
      return;
    }

    const eventName = \`__automa-fetch-response-\${id}__\`;
    const eventListener = ({ detail }) => {
      if (detail.id !== id) return;

      window.removeEventListener(eventName, eventListener);

      if (detail.isError) {
        reject(new Error(detail.result));
      } else {
        resolve(detail.result);
      }
    };

    window.addEventListener(eventName, eventListener);
    window.dispatchEvent(
      new CustomEvent(\`__automa-fetch__\`, {
        detail: {
          id,
          type,
          resource,
        },
      })
    );
  });
}

function automaFetch(type, resource) {
  return automaFetchClient('${varName}', { type, resource });
}
  `;

  if (everyNewTab) str = automaRefDataStr(varName);

  return str;
};

message.on(
  'script:execute',
  async ({ target, blockData, varName, preloadScripts }) => {
    try {
      const automaScript = getAutomaScript({
        varName,
        isEval: false,
        refData: blockData.refData,
        everyNewTab: blockData.data.everyNewTab,
      });

      const result = await browser.scripting.executeScript({
        target,
        func: ($blockData, $preloadScripts, $automaScript) => {
          return new Promise((resolve, reject) => {
            try {
              const $documentCtx = document;

              // fixme: 需要处理iframe的情况
              // if ($blockData.frameSelector) {
              //   const iframeCtx = getDocumentCtx($blockData.frameSelector);
              //   if (!iframeCtx) {
              //     reject(new Error('iframe-not-found'));
              //     return;
              //   }
              //   $documentCtx = iframeCtx;
              // }

              const scriptAttr = `block--${$blockData.id}`;
              const isScriptExists = $documentCtx.querySelector(
                `.automa-custom-js[${scriptAttr}]`
              );
              if (isScriptExists) {
                resolve('');
                return;
              }

              const script = $documentCtx.createElement('script');
              script.setAttribute(scriptAttr, '');
              script.classList.add('automa-custom-js');
              script.textContent = `
                (() => {

                  // Setup context
                  ${$automaScript}

                  // Execute user code
                  try {
                    ${$blockData.data.code}
                    ${
                      $blockData.data.everyNewTab ||
                      $blockData.data.code.includes('automaNextBlock')
                        ? ''
                        : 'automaNextBlock()'
                    }
                  } catch (error) {
                    console.error(error);
                    ${
                      $blockData.data.everyNewTab
                        ? ''
                        : 'automaNextBlock({ $error: true, message: error.message })'
                    }
                  }
                })();
              `;

              const preloadScriptsEl = $preloadScripts.map((item) => {
                const scriptEl = $documentCtx.createElement('script');
                scriptEl.id = item.id;
                scriptEl.textContent = item.script;
                return {
                  element: scriptEl,
                  removeAfterExec: item.removeAfterExec,
                };
              });

              if (!$blockData.data.everyNewTab) {
                let timeout;
                let onNextBlock;
                let onResetTimeout;

                const cleanUp = () => {
                  script.remove();
                  preloadScriptsEl.forEach((item) => {
                    if (item.removeAfterExec) item.element.remove();
                  });

                  clearTimeout(timeout);

                  $documentCtx.body.removeEventListener(
                    '__automa-reset-timeout__',
                    onResetTimeout
                  );
                  $documentCtx.body.removeEventListener(
                    '__automa-next-block__',
                    onNextBlock
                  );
                };

                onNextBlock = ({ detail }) => {
                  cleanUp();
                  if (!detail) {
                    resolve({ columns: {}, variables: {} });
                    return;
                  }

                  const payload = {
                    insert: detail.insert,
                    data: detail.data?.$error
                      ? detail.data
                      : JSON.stringify(detail?.data ?? {}),
                  };
                  resolve({
                    columns: payload,
                    variables: detail.refData?.variables,
                  });
                };
                onResetTimeout = () => {
                  clearTimeout(timeout);
                  timeout = setTimeout(cleanUp, $blockData.data.timeout);
                };

                $documentCtx.body.addEventListener(
                  '__automa-next-block__',
                  onNextBlock
                );
                $documentCtx.body.addEventListener(
                  '__automa-reset-timeout__',
                  onResetTimeout
                );

                timeout = setTimeout(cleanUp, $blockData.data.timeout);
              } else {
                resolve();
              }

              // Inject scripts in the correct order
              preloadScriptsEl.forEach((item) => {
                $documentCtx.head.appendChild(item.element);
              });
              $documentCtx.head.appendChild(script);
            } catch (error) {
              console.error('javascriptBlockUtil error', error);
              reject(error);
            }
          });
        },
        world: 'MAIN',
        args: [blockData, preloadScripts, automaScript],
      });

      return [{ result: result[0].result }];
    } catch (err) {
      return { result: null, msg: err.message, error: err };
    }
  }
);

message.on('script:execute-callback', async ({ target, callback }) => {
  try {
    // 首先尝试使用scripting API执行脚本
    const result = await browser.scripting.executeScript({
      target,
      func: ($callbackFn) => {
        try {
          const script = document.createElement('script');
          script.textContent = `
          (() => {
            ${$callbackFn}
          })()
          `;
          document.body.appendChild(script);
          return { success: true };
        } catch (error) {
          console.error('执行脚本时出错:', error);
          return { success: false, error: error.message };
        }
      },
      world: 'MAIN',
      args: [callback],
    });

    // 检查执行结果
    const executionResult = result[0]?.result;
    if (executionResult && executionResult.success) {
      return true;
    }

    // 如果常规方法失败，尝试使用debugger API
    await new Promise((resolve) => {
      chrome.debugger.attach({ tabId: target.tabId }, '1.3', resolve);
    });

    // 使用debugger API执行脚本
    const execResult = await chrome.debugger.sendCommand(
      { tabId: target.tabId },
      'Runtime.evaluate',
      {
        expression: `(() => { ${callback} })()`,
        userGesture: true,
        awaitPromise: false,
        returnByValue: true,
      }
    );

    // 执行完成后分离debugger
    await chrome.debugger.detach({ tabId: target.tabId });

    if (!execResult || !execResult.result) {
      console.error('使用debugger API执行脚本失败');
      return false;
    }

    return true;
  } catch (error) {
    console.error('执行script:execute-callback时出错:', error);
    return false;
  }
});

const DOWNLOADS_STORAGE_KEY = 'automa-rename-downloaded-files';

const getFileExtension = (str) => /(?:\.([^.]+))?$/.exec(str)[1];

const downloadListeners = {
  registered: false,
  changedCallbacks: new Map(),
  pendingRequests: [],
  downloadDataCache: new Map(),
  handledFilenameCallbacks: new Set(),
  suggestCalled: new Set(),
  downloadInfo: new Map(),
};

/**
 * @param {Object} item
 * @param {Function} suggest
 * @returns {boolean}
 */
function determineFilenameListener(item, suggest) {
  const downloadKey = `download-${item.id}`;

  if (downloadListeners.suggestCalled.has(downloadKey)) {
    return true;
  }

  downloadListeners.suggestCalled.add(downloadKey);

  setTimeout(async () => {
    try {
      let suggestion = null;
      if (downloadListeners.downloadDataCache.has(item.id)) {
        suggestion = downloadListeners.downloadDataCache.get(item.id);
      } else {
        const result = await browser.storage.session.get(DOWNLOADS_STORAGE_KEY);
        const filesData = result[DOWNLOADS_STORAGE_KEY] || {};

        suggestion = filesData[item.id];
      }

      if (!suggestion) {
        // we should not call suggest again, because Chrome expects us to handle it
        return;
      }

      if (!suggestion.filename || suggestion.filename.trim() === '') {
        return;
      }

      const hasFileExt = getFileExtension(suggestion.filename);

      if (!hasFileExt) {
        const fileExtension = getFileExtension(item.filename);
        suggestion.filename += `.${fileExtension}`;
      }

      let conflictAction = 'uniquify';
      const validActions = ['uniquify', 'overwrite', 'prompt'];

      if (
        suggestion.onConflict &&
        validActions.includes(suggestion.onConflict)
      ) {
        conflictAction = suggestion.onConflict;
      }

      if (!suggestion.waitForDownload) {
        downloadListeners.downloadDataCache.delete(item.id);

        const result = await browser.storage.session.get(DOWNLOADS_STORAGE_KEY);
        const filesData = result[DOWNLOADS_STORAGE_KEY] || {};
        delete filesData[item.id];
        await browser.storage.session.set({
          [DOWNLOADS_STORAGE_KEY]: filesData,
        });
      }

      downloadListeners.handledFilenameCallbacks.add(downloadKey);

      try {
        suggest({
          filename: suggestion.filename,
          conflictAction,
        });
      } catch (callbackError) {
        console.error('❌ failed to call suggest callback:', callbackError);
      }
    } catch (error) {
      console.error('❌ failed to handle download filename:', error);
    }
  }, 0);

  // important: we use async processing, so we must return true
  return true;
}

function handleDownloadChanged(downloadDelta) {
  const { id, state, filename } = downloadDelta;

  if (!id || !downloadListeners.changedCallbacks.has(id)) return;

  if (!downloadListeners.downloadInfo.has(id)) {
    downloadListeners.downloadInfo.set(id, {
      downloadId: id,
      state: null,
      filename: null,
    });
  }

  const downloadInfo = downloadListeners.downloadInfo.get(id);

  if (state) {
    downloadInfo.state = state.current;
  }

  if (filename) {
    downloadInfo.filename = filename.current;
  }

  if (
    downloadInfo.state &&
    ['complete', 'interrupted'].includes(downloadInfo.state)
  ) {
    const callback = downloadListeners.changedCallbacks.get(id);

    const completeInfo = {
      ...downloadInfo,

      filename:
        downloadInfo.filename ||
        (downloadListeners.downloadDataCache.has(id)
          ? downloadListeners.downloadDataCache.get(id).filename
          : null),
    };

    try {
      callback(completeInfo);
    } catch (callbackError) {
      console.error(
        '❌ failed to call download changed callback:',
        callbackError
      );
    }

    downloadListeners.changedCallbacks.delete(id);
    downloadListeners.downloadDataCache.delete(id);
    downloadListeners.downloadInfo.delete(id);

    const downloadKey = `download-${id}`;
    downloadListeners.handledFilenameCallbacks.delete(downloadKey);
    downloadListeners.suggestCalled.delete(downloadKey);
  }
}

async function handleDownloadCreated(downloadItem) {
  try {
    let isHandled = false;
    const pendingDownloads = downloadListeners.pendingRequests || [];

    if (pendingDownloads.length > 0) {
      const pendingRequest = pendingDownloads.shift();
      const { downloadData, callback } = pendingRequest;

      // save to memory cache immediately to avoid race condition
      downloadListeners.downloadDataCache.set(downloadItem.id, downloadData);

      // save to storage
      const result = await browser.storage.session.get(DOWNLOADS_STORAGE_KEY);
      const filesData = result[DOWNLOADS_STORAGE_KEY] || {};
      filesData[downloadItem.id] = downloadData;
      await browser.storage.session.set({ [DOWNLOADS_STORAGE_KEY]: filesData });

      if (downloadData.waitForDownload && callback) {
        downloadListeners.changedCallbacks.set(downloadItem.id, callback);
      }

      isHandled = true;
    }

    if (!isHandled) {
      const result = await browser.storage.session.get(DOWNLOADS_STORAGE_KEY);
      const filesData = result[DOWNLOADS_STORAGE_KEY] || {};

      if (filesData[downloadItem.id]) {
        downloadListeners.downloadDataCache.set(
          downloadItem.id,
          filesData[downloadItem.id]
        );
      }
    }
  } catch (error) {
    console.error('❌ failed to handle download created:', error);
  }
}

function cleanupDownloadListeners() {
  const MAX_AGE = 60 * 60 * 1000; // 1 hour
  const now = Date.now();

  if (downloadListeners.handledFilenameCallbacksTimestamp) {
    if (now - downloadListeners.handledFilenameCallbacksTimestamp > MAX_AGE) {
      downloadListeners.handledFilenameCallbacks.clear();
    }
  }

  downloadListeners.handledFilenameCallbacksTimestamp = now;
}

setInterval(cleanupDownloadListeners, 60 * 60 * 1000);

async function registerBackgroundDownloadListeners() {
  try {
    if (browser.downloads.onCreated.hasListener(handleDownloadCreated)) {
      browser.downloads.onCreated.removeListener(handleDownloadCreated);
    }

    if (
      !IS_FIREFOX &&
      browser.downloads.onDeterminingFilename &&
      browser.downloads.onDeterminingFilename.hasListener(
        determineFilenameListener
      )
    ) {
      browser.downloads.onDeterminingFilename.removeListener(
        determineFilenameListener
      );
    }

    if (browser.downloads.onChanged.hasListener(handleDownloadChanged)) {
      browser.downloads.onChanged.removeListener(handleDownloadChanged);
    }

    downloadListeners.handledFilenameCallbacks.clear();
    downloadListeners.suggestCalled.clear();
    downloadListeners.downloadInfo.clear();

    if (downloadListeners.registered) {
      downloadListeners.registered = false;
    }
  } catch (cleanupError) {
    console.warn('⚠️ failed to cleanup existing listeners:', cleanupError);
  }

  if (downloadListeners.registered) return;

  try {
    // 确保有下载权限
    const hasPermission = await browser.permissions.contains({
      permissions: ['downloads'],
    });
    if (!hasPermission) {
      console.error('❌ no download permission, cannot register listeners');
      return;
    }

    browser.downloads.onCreated.addListener(handleDownloadCreated);

    if (!IS_FIREFOX && browser.downloads.onDeterminingFilename) {
      browser.downloads.onDeterminingFilename.addListener(
        determineFilenameListener
      );
    }

    browser.downloads.onChanged.addListener(handleDownloadChanged);

    downloadListeners.registered = true;
    downloadListeners.pendingRequests = [];

    downloadListeners.handledFilenameCallbacksTimestamp = Date.now();
  } catch (error) {
    console.error('❌ failed to register download listeners:', error);
  }
}

message.on('downloads:register-listeners', async () => {
  await registerBackgroundDownloadListeners();
  return true;
});

message.on('downloads:watch-created', async (data) => {
  console.log('👀 监听下载创建:', data);
  await registerBackgroundDownloadListeners();

  // 保存等待下载的请求
  downloadListeners.pendingRequests = downloadListeners.pendingRequests || [];

  // 安全地包装回调函数
  let safeCallback = null;
  if (typeof data.onComplete === 'function') {
    safeCallback = (response) => {
      try {
        console.log('🔄 调用下载完成回调函数:', response);
        data.onComplete(response);
      } catch (callbackError) {
        console.error('❌ 执行下载完成回调函数出错:', callbackError);
      }
    };
  }

  downloadListeners.pendingRequests.push({
    downloadData: data.downloadData,
    tabId: data.tabId,
    callback: safeCallback,
  });
  console.log(
    '📋 添加到待处理下载队列, 当前队列长度:',
    downloadListeners.pendingRequests.length
  );

  return true;
});

message.on('downloads:watch-changed', async ({ downloadId, onComplete }) => {
  console.log('👀 监听下载状态变化:', downloadId);
  await registerBackgroundDownloadListeners();

  if (downloadId && typeof onComplete === 'function') {
    // 安全地包装回调函数
    const safeCallback = (response) => {
      try {
        console.log('🔄 调用下载状态变更回调函数:', response);
        onComplete(response);
      } catch (callbackError) {
        console.error('❌ 执行下载状态变更回调函数出错:', callbackError);
      }
    };

    downloadListeners.changedCallbacks.set(downloadId, safeCallback);
    console.log('📌 已设置下载完成回调:', downloadId);
  }

  return true;
});

automa('background', message);

browser.runtime.onMessage.addListener(message.listener);

import { IS_FIREFOX } from '@/common/utils/constant';
import BrowserAPIEventHandler from '@/service/browser-api/BrowserAPIEventHandler';
import BrowserAPIService from '@/service/browser-api/BrowserAPIService';
import { useUserStore } from '@/stores/user';
import getFile, { readFileAsBase64 } from '@/utils/getFile';
import { sleep } from '@/utils/helper';
import { MessageListener } from '@/utils/message';

import { getDocumentCtx } from '@/content/handleSelector';
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
                const escapeElPolicy = window.trustedTypes.createPolicy(
                  'forceInner',
                  {
                    createHTML: (to_escape) => to_escape,
                    createScript: (to_escape) => to_escape,
                  }
                );
                return escapeElPolicy.createScript(script);
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

        // eslint-disable-next-line no-new-func
        const callbackFn = new Function(`return ${callback}`)();

        const jsCode = await callbackFn();
        const execResult = await chrome.debugger.sendCommand(
          { tabId: target.tabId },
          'Runtime.evaluate',
          {
            expression: jsCode,
            userGesture: true,
            awaitPromise: true,
            returnByValue: true,
            ...(options || {}),
          }
        );

        if (!debugMode) {
          await chrome.debugger.detach({ tabId: target.tabId });
        }

        if (!execResult || !execResult.result) {
          throw new Error('Unable execute code');
        }

        if (execResult.result.subtype === 'error') {
          throw new Error(execResult.result.description);
        }

        return {
          isBlocked: true,
          value: execResult.result.value || null,
        };
      }

      return { isBlocked: false, value: null };
    } catch (err) {
      console.error('CSP check error:', err);
      return { isBlocked: false, value: null };
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

    const eventName = '__automa-fetch-response-' + id +__;
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
      new CustomEvent('__automa-fetch__', {
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
  return automaFetchClient.toString()('${varName}', { type, resource });
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
              let $documentCtx = document;

              if ($blockData.frameSelector) {
                const iframeCtx = getDocumentCtx($blockData.frameSelector);
                if (!iframeCtx) {
                  reject(new Error('iframe-not-found'));
                  return;
                }
                $documentCtx = iframeCtx;
              }

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

automa('background', message);

browser.runtime.onMessage.addListener(message.listener);

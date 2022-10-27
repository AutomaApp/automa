import browser from 'webextension-polyfill';
import { MessageListener } from '@/utils/message';
import { sleep } from '@/utils/helper';
import getFile from '@/utils/getFile';
import automa from '@business';
import { registerWorkflowTrigger } from '../utils/workflowTrigger';
import BackgroundUtils from './BackgroundUtils';
import BackgroundWorkflowUtils from './BackgroundWorkflowUtils';
import BackgroundEventsListeners from './BackgroundEventsListeners';

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

const contextMenu =
  BROWSER_TYPE === 'firefox' ? browser.menus : browser.contextMenus;
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

message.on('fetch', ({ type, resource }) => {
  return fetch(resource.url, resource).then((response) => {
    if (!response.ok) throw new Error(response.statusText);

    return response[type]();
  });
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
    url: chrome.runtime.getURL('/newtab.html'),
  });

  tabs.forEach((tab) => {
    browser.tabs.sendMessage(tab.id, {
      type: 'refresh-packages',
    });
  });
});

message.on('workflow:execute', (workflowData, sender) => {
  if (workflowData.includeTabId) {
    if (!workflowData.options) workflowData.options = {};

    workflowData.options.tabId = sender.tab.id;
  }

  BackgroundWorkflowUtils.executeWorkflow(
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

automa('background', message);

browser.runtime.onMessage.addListener(message.listener());

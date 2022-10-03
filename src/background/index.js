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

browser.tabs.onCreated.addListener(BackgroundEventsListeners.onTabCreated);
browser.tabs.onActivated.addListener(BackgroundEventsListeners.onTabsActivated);

browser.commands.onCommand.addListener(BackgroundEventsListeners.onCommand);

browser.action.onClicked.addListener(BackgroundEventsListeners.onActionClicked);

browser.runtime.onStartup.addListener(
  BackgroundEventsListeners.onRuntimeStartup
);
browser.runtime.onInstalled.addListener(
  BackgroundEventsListeners.onRuntimeInstalled
);

browser.webNavigation.onCommitted.addListener(
  BackgroundEventsListeners.onWebNavigationCommited
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

message.on('fetch:text', (url) => {
  return fetch(url).then((response) => response.text());
});
message.on('open:dashboard', async (url) => {
  await BackgroundUtils.openDashboard(url);

  return Promise.resolve(true);
});
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
message.on('get:tab-screenshot', (options) =>
  browser.tabs.captureVisibleTab(options)
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
message.on('workflow:added', ({ workflowId, teamId, source = 'community' }) => {
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
            data: { workflowId, teamId, source },
            type: 'workflow:added',
          });
        });

        browser.tabs.update(lastTab.id, {
          active: true,
        });
      } else {
        BackgroundUtils.openDashboard(`${path}?permission=true`);
      }
    });
});
message.on('workflow:register', ({ triggerBlock, workflowId }) => {
  registerWorkflowTrigger(workflowId, triggerBlock);
});

automa('background', message);

browser.runtime.onMessage.addListener(message.listener());

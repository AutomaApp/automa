import browser from 'webextension-polyfill';
import dayjs from '@/lib/dayjs';
import { MessageListener } from '@/utils/message';
import { parseJSON, findTriggerBlock, sleep } from '@/utils/helper';
import { fetchApi } from '@/utils/api';
import getFile from '@/utils/getFile';
import decryptFlow, { getWorkflowPass } from '@/utils/decryptFlow';
import convertWorkflowData from '@/utils/convertWorkflowData';
import getBlockMessage from '@/utils/getBlockMessage';
import automa from '@business';
import {
  registerCronJob,
  registerSpecificDay,
  registerContextMenu,
  registerWorkflowTrigger,
} from '../utils/workflowTrigger';
import WorkflowState from './WorkflowState';
import WorkflowEngine from './workflowEngine/engine';
import blocksHandler from './workflowEngine/blocksHandler';
import WorkflowLogger from './WorkflowLogger';

const validateUrl = (str) => str?.startsWith('http');
const flattenTeamWorkflows = (workflows) =>
  Object.values(Object.values(workflows)[0]);

const browserStorage = {
  async get(key) {
    try {
      const result = await browser.storage.local.get(key);

      return result[key];
    } catch (error) {
      console.error(error);
      return [];
    }
  },
  async set(key, value) {
    await browser.storage.local.set({ [key]: value });

    if (key === 'workflowState') {
      sessionStorage.setItem(key, JSON.stringify(value));
    }
  },
};
const localStateStorage = {
  get(key) {
    const data = parseJSON(localStorage.getItem(key), null);

    return data;
  },
  set(key, value) {
    const data = typeof value === 'object' ? JSON.stringify(value) : value;

    return localStorage.setItem(key, data);
  },
};
const workflow = {
  states: new WorkflowState({ storage: localStateStorage }),
  logger: new WorkflowLogger({ storage: browserStorage }),
  async get(workflowId) {
    if (!workflowId) return null;

    if (workflowId.startsWith('team')) {
      const { teamWorkflows } = await browser.storage.local.get(
        'teamWorkflows'
      );
      if (!teamWorkflows) return null;

      const workflows = flattenTeamWorkflows(teamWorkflows);

      return workflows.find((item) => item.id === workflowId);
    }

    const { workflows, workflowHosts } = await browser.storage.local.get([
      'workflows',
      'workflowHosts',
    ]);
    let findWorkflow = Array.isArray(workflows)
      ? workflows.find(({ id }) => id === workflowId)
      : workflows[workflowId];

    if (!findWorkflow) {
      findWorkflow = Object.values(workflowHosts || {}).find(
        ({ hostId }) => hostId === workflowId
      );

      if (findWorkflow) findWorkflow.id = findWorkflow.hostId;
    }

    return findWorkflow;
  },
  execute(workflowData, options) {
    if (workflowData.isDisabled) return null;
    if (workflowData.isProtected) {
      const flow = parseJSON(workflowData.drawflow, null);

      if (!flow) {
        const pass = getWorkflowPass(workflowData.pass);

        workflowData.drawflow = decryptFlow(workflowData, pass);
      }
    }

    const convertedWorkflow = convertWorkflowData(workflowData);
    const engine = new WorkflowEngine(convertedWorkflow, {
      options,
      logger: this.logger,
      states: this.states,
      blocksHandler: blocksHandler(),
    });

    engine.init();
    engine.on(
      'destroyed',
      ({
        id,
        status,
        history,
        startedTimestamp,
        endedTimestamp,
        blockDetail,
      }) => {
        if (workflowData.id.startsWith('team') && workflowData.teamId) {
          const payload = {
            status,
            workflowId: workflowData.id,
            workflowLog: {
              status,
              endedTimestamp,
              startedTimestamp,
            },
          };

          if (status === 'error') {
            const message = getBlockMessage(blockDetail);
            const workflowHistory = history.map((item) => {
              delete item.logId;
              delete item.prevBlockData;
              delete item.workerId;

              item.description = item.description || '';

              return item;
            });
            payload.workflowLog = {
              status,
              message,
              endedTimestamp,
              startedTimestamp,
              history: workflowHistory,
              blockId: blockDetail.blockId,
            };
          }

          fetchApi(`/teams/${workflowData.teamId}/workflows/logs`, {
            method: 'POST',
            body: JSON.stringify(payload),
          }).catch((error) => {
            console.error(error);
          });
        }

        if (status !== 'stopped') {
          browser.permissions
            .contains({ permissions: ['notifications'] })
            .then((hasPermission) => {
              if (!hasPermission || !workflowData.settings.notification) return;

              const name = workflowData.name.slice(0, 32);

              browser.notifications.create(`logs:${id}`, {
                type: 'basic',
                iconUrl: browser.runtime.getURL('icon-128.png'),
                title: status === 'success' ? 'Success' : 'Error',
                message: `${
                  status === 'success' ? 'Successfully' : 'Failed'
                } to run the "${name}" workflow`,
              });
            });
        }
      }
    );

    const lastCheckStatus = localStorage.getItem('check-status');
    const isSameDay = dayjs().isSame(lastCheckStatus, 'day');
    if (!isSameDay) {
      fetchApi('/status')
        .then((response) => response.json())
        .then(() => {
          localStorage.setItem('check-status', new Date());
        });
    }

    return engine;
  },
};

async function updateRecording(callback) {
  const { isRecording, recording } = await browser.storage.local.get([
    'isRecording',
    'recording',
  ]);

  if (!isRecording || !recording) return;

  callback(recording);

  await browser.storage.local.set({ recording });
}
async function openDashboard(url) {
  const tabOptions = {
    active: true,
    url: browser.runtime.getURL(
      `/newtab.html#${typeof url === 'string' ? url : ''}`
    ),
  };

  try {
    const [tab] = await browser.tabs.query({
      url: browser.runtime.getURL('/newtab.html'),
    });

    if (tab) {
      await browser.tabs.update(tab.id, tabOptions);

      if (tabOptions.url.includes('workflows/')) {
        await browser.tabs.reload(tab.id);
      }
    } else {
      browser.tabs.create(tabOptions);
    }
  } catch (error) {
    console.error(error);
  }
}
async function checkVisitWebTriggers(tabId, tabUrl) {
  const visitWebTriggers = await browserStorage.get('visitWebTriggers');
  if (!visitWebTriggers || visitWebTriggers.length === 0) return;

  const workflowState = await workflow.states.get(({ state }) =>
    state.tabIds.includes(tabId)
  );
  const triggeredWorkflow = visitWebTriggers?.find(({ url, isRegex, id }) => {
    if (url.trim() === '') return false;

    const matchUrl = tabUrl.match(isRegex ? new RegExp(url, 'g') : url);

    return matchUrl && !id.includes(workflowState?.workflowId);
  });

  if (triggeredWorkflow) {
    let workflowId = triggeredWorkflow.id;
    if (triggeredWorkflow.id.startsWith('trigger')) {
      const { 1: triggerWorkflowId } = triggeredWorkflow.id.split(':');
      workflowId = triggerWorkflowId;
    }

    const workflowData = await workflow.get(workflowId);
    if (workflowData && !workflow.isDisabled)
      workflow.execute(workflowData, { tabId });
  }
}
async function checkRecordingWorkflow(tabId, tabUrl) {
  if (!validateUrl(tabUrl)) return;

  const isRecording = await browserStorage.get('isRecording');
  if (!isRecording) return;

  await browser.tabs.executeScript(tabId, {
    allFrames: true,
    file: 'recordWorkflow.bundle.js',
  });
}
browser.webNavigation.onCompleted.addListener(
  async ({ tabId, url, frameId }) => {
    if (frameId > 0) return;

    checkRecordingWorkflow(tabId, url);
    checkVisitWebTriggers(tabId, url);
  }
);
browser.commands.onCommand.addListener((name) => {
  if (name === 'open-dashboard') openDashboard();
});
browser.webNavigation.onCommitted.addListener(
  ({ frameId, tabId, url, transitionType }) => {
    const allowedType = ['link', 'typed'];
    if (frameId !== 0 || !allowedType.includes(transitionType)) return;

    updateRecording((recording) => {
      if (tabId !== recording.activeTab.id) return;

      const lastFlow = recording.flows.at(-1) ?? {};
      const isInvalidNewtabFlow =
        lastFlow &&
        lastFlow.id === 'new-tab' &&
        !validateUrl(lastFlow.data.url);

      if (isInvalidNewtabFlow) {
        lastFlow.data.url = url;
        lastFlow.description = url;
      } else if (validateUrl(url)) {
        if (lastFlow?.id !== 'link' || !lastFlow.isClickLink) {
          recording.flows.push({
            id: 'new-tab',
            description: url,
            data: {
              url,
              updatePrevTab: recording.activeTab.id === tabId,
            },
          });
        }

        recording.activeTab.id = tabId;
        recording.activeTab.url = url;
      }
    });
  }
);
browser.tabs.onActivated.addListener(async ({ tabId }) => {
  const { url, id, title } = await browser.tabs.get(tabId);

  if (!validateUrl(url)) return;

  updateRecording((recording) => {
    recording.activeTab = { id, url };
    recording.flows.push({
      id: 'switch-tab',
      description: title,
      data: {
        url,
        matchPattern: url,
        createIfNoMatch: true,
      },
    });
  });
});
browser.tabs.onCreated.addListener(async (tab) => {
  const { isRecording, recording } = await browser.storage.local.get([
    'isRecording',
    'recording',
  ]);

  if (!isRecording || !recording) return;

  const url = tab.url || tab.pendingUrl;
  const lastFlow = recording.flows[recording.flows.length - 1];
  const invalidPrevFlow =
    lastFlow && lastFlow.id === 'new-tab' && !validateUrl(lastFlow.data.url);

  if (!invalidPrevFlow) {
    const validUrl = validateUrl(url) ? url : '';

    recording.flows.push({
      id: 'new-tab',
      data: {
        url: validUrl,
        description: tab.title || validUrl,
      },
    });
  }

  recording.activeTab = {
    url,
    id: tab.id,
  };

  await browser.storage.local.set({ recording });
});
browser.alarms.onAlarm.addListener(async ({ name }) => {
  let workflowId = name;
  let triggerId = null;

  if (name.startsWith('trigger')) {
    const { 1: triggerWorkflowId, 2: triggerItemId } = name.split(':');
    triggerId = triggerItemId;
    workflowId = triggerWorkflowId;
  }

  const currentWorkflow = await workflow.get(workflowId);
  if (!currentWorkflow) return;

  let data = currentWorkflow.trigger;
  if (!data) {
    const drawflow =
      typeof currentWorkflow.drawflow === 'string'
        ? parseJSON(currentWorkflow.drawflow, {})
        : currentWorkflow.drawflow;
    const { data: triggerBlockData } = findTriggerBlock(drawflow) || {};
    data = triggerBlockData;
  }

  if (triggerId) {
    data = data.triggers.find((trigger) => trigger.id === triggerId);
    if (data) data = { ...data, ...data.data };
  }

  if (data && data.type === 'interval' && data.fixedDelay) {
    const workflowState = await workflow.states.get(
      (item) => item.workflowId === workflowId
    );

    if (workflowState) {
      let { workflowQueue } = await browser.storage.local.get('workflowQueue');
      workflowQueue = workflowQueue || [];

      if (!workflowQueue.includes(workflowId)) {
        (workflowQueue = workflowQueue || []).push(workflowId);
        await browser.storage.local.set({ workflowQueue });
      }

      return;
    }
  } else if (data && data.type === 'date') {
    const [hour, minute, second] = data.time.split(':');
    const date = dayjs(data.date)
      .hour(hour)
      .minute(minute)
      .second(second || 0);

    const isAfter = dayjs(Date.now() - 60 * 1000).isAfter(date);
    if (isAfter) return;
  }

  workflow.execute(currentWorkflow);

  if (!data) return;

  if (['specific-day', 'cron-job'].includes(data.type)) {
    if (data.type === 'specific-day') {
      registerSpecificDay(name, data);
    } else {
      registerCronJob(name, data);
    }
  }
});

const contextMenu =
  BROWSER_TYPE === 'firefox' ? browser.menus : browser.contextMenus;
if (contextMenu && contextMenu.onClicked) {
  contextMenu.onClicked.addListener(
    async ({ parentMenuItemId, menuItemId, frameId }, tab) => {
      try {
        if (parentMenuItemId !== 'automaContextMenu') return;

        const message = await browser.tabs.sendMessage(
          tab.id,
          {
            type: 'context-element',
          },
          { frameId }
        );
        let workflowId = menuItemId;

        if (menuItemId.startsWith('trigger')) {
          const { 1: triggerWorkflowId } = menuItemId.split(':');
          workflowId = triggerWorkflowId;
        }

        const workflowData = await workflow.get(workflowId);

        workflow.execute(workflowData, {
          data: {
            variables: message,
          },
        });
      } catch (error) {
        console.error(error);
      }
    }
  );
}

if (browser.notifications && browser.notifications.onClicked) {
  browser.notifications.onClicked.addListener((notificationId) => {
    if (notificationId.startsWith('logs')) {
      const { 1: logId } = notificationId.split(':');
      openDashboard(`/logs/${logId}`);
    }
  });
}

browser.runtime.onInstalled.addListener(async ({ reason }) => {
  try {
    if (reason === 'install') {
      await browser.storage.local.set({
        logs: [],
        shortcuts: {},
        workflows: [],
        collections: [],
        workflowState: {},
        isFirstTime: true,
        visitWebTriggers: [],
      });
      await browser.tabs.create({
        active: true,
        url: browser.runtime.getURL('newtab.html#/welcome'),
      });

      return;
    }

    if (reason === 'update') {
      let { workflows } = await browser.storage.local.get('workflows');
      const alarmTypes = ['specific-day', 'date', 'interval'];

      workflows = Array.isArray(workflows)
        ? workflows
        : Object.values(workflows);
      workflows.forEach(({ trigger, drawflow, id }) => {
        let workflowTrigger = trigger?.data || trigger;

        if (!trigger) {
          const flows = parseJSON(drawflow, drawflow);
          workflowTrigger = findTriggerBlock(flows)?.data;
        }

        const triggerType = workflowTrigger?.type;

        if (alarmTypes.includes(triggerType)) {
          registerWorkflowTrigger(id, { data: workflowTrigger });
        } else if (triggerType === 'context-menu') {
          registerContextMenu(id, workflowTrigger);
        }
      });
    }
  } catch (error) {
    console.error(error);
  }
});
browser.runtime.onStartup.addListener(async () => {
  try {
    const { workflows, workflowHosts, teamWorkflows } =
      await browser.storage.local.get([
        'workflows',
        'workflowHosts',
        'teamWorkflows',
      ]);
    const convertToArr = (value) =>
      Array.isArray(value) ? value : Object.values(value);

    const workflowsArr = convertToArr(workflows);

    if (workflowHosts) {
      workflowsArr.push(...convertToArr(workflowHosts));
    }
    if (teamWorkflows) {
      workflowsArr.push(...flattenTeamWorkflows(teamWorkflows));
    }

    for (const currWorkflow of workflowsArr) {
      let triggerBlock = currWorkflow.trigger;

      if (!triggerBlock) {
        const flow =
          typeof currWorkflow.drawflow === 'string'
            ? parseJSON(currWorkflow.drawflow, {})
            : currWorkflow.drawflow;

        triggerBlock = findTriggerBlock(flow)?.data;
      }

      const executeWorkflow = async (trigger, triggerData) => {
        if (trigger.type === 'on-startup') {
          workflow.execute(currWorkflow);
        } else {
          await registerWorkflowTrigger(currWorkflow.id, triggerData);
        }
      };

      if (triggerBlock) {
        if (triggerBlock.triggers) {
          for (const trigger of triggerBlock.triggers) {
            await executeWorkflow(trigger, trigger);
          }
        } else {
          await executeWorkflow(triggerBlock, { data: triggerBlock });
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
});

const message = new MessageListener('background');

message.on('fetch:text', (url) => {
  return fetch(url).then((response) => response.text());
});
message.on('open:dashboard', async (url) => {
  await openDashboard(url);

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
  const tabs = await browser.tabs.query({ url: chrome.runtime.getURL('/*') });

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

  workflow.execute(workflowData, workflowData?.options || {});
});
message.on('workflow:stop', (id) => workflow.states.stop(id));
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
        openDashboard(`${path}?permission=true`);
      }
    });
});
message.on('workflow:register', ({ triggerBlock, workflowId }) => {
  registerWorkflowTrigger(workflowId, triggerBlock);
});

automa('background', message);

browser.runtime.onMessage.addListener(message.listener());

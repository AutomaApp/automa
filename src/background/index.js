import browser from 'webextension-polyfill';
import { MessageListener } from '@/utils/message';
import { parseJSON, findTriggerBlock } from '@/utils/helper';
import getFile from '@/utils/getFile';
import decryptFlow, { getWorkflowPass } from '@/utils/decryptFlow';
import {
  registerSpecificDay,
  registerWorkflowTrigger,
} from '../utils/workflowTrigger';
import WorkflowState from './WorkflowState';
import CollectionEngine from './collectionEngine';
import WorkflowEngine from './workflowEngine/engine';
import blocksHandler from './workflowEngine/blocksHandler';
import WorkflowLogger from './WorkflowLogger';

const validateUrl = (str) => str?.startsWith('http');
const storage = {
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
const workflow = {
  states: new WorkflowState({ storage }),
  logger: new WorkflowLogger({ storage }),
  async get(workflowId) {
    const { workflows, workflowHosts } = await browser.storage.local.get([
      'workflows',
      'workflowHosts',
    ]);
    let findWorkflow = workflows.find(({ id }) => id === workflowId);

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

    const engine = new WorkflowEngine(workflowData, {
      options,
      blocksHandler,
      logger: this.logger,
      states: this.states,
    });

    if (options?.resume) {
      engine.resume(options.state);
    } else {
      engine.init();
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

      if (tab.url.includes('workflows/')) {
        await browser.tabs.reload(tab.id);
      }
    } else {
      browser.tabs.create(tabOptions);
    }
  } catch (error) {
    console.error(error);
  }
}
async function checkWorkflowStates() {
  const states = await workflow.states.get();
  // const sessionStates = parseJSON(sessionStorage.getItem('workflowState'), {});

  Object.values(states || {}).forEach((state) => {
    /* Enable when using manifest 3 */
    // const resumeWorkflow =
    //   !state.isDestroyed && objectHasKey(sessionStates, state.id);

    if (false) {
      workflow.get(state.workflowId).then((workflowData) => {
        workflow.execute(workflowData, {
          state,
          resume: true,
        });
      });
    } else {
      delete states[state.id];
    }
  });

  await storage.set('workflowState', states);
}
checkWorkflowStates();
async function checkVisitWebTriggers(changeInfo, tab) {
  if (!changeInfo.status || changeInfo.status !== 'complete') return;

  const tabIsUsed = await workflow.states.get(({ state }) =>
    state.tabIds.includes(tab.id)
  );

  if (tabIsUsed) return;

  const visitWebTriggers = await storage.get('visitWebTriggers');
  const triggeredWorkflow = visitWebTriggers.find(({ url, isRegex }) => {
    if (url.trim() === '') return false;

    return tab.url.match(isRegex ? new RegExp(url, 'g') : url);
  });

  if (triggeredWorkflow) {
    const workflowData = await workflow.get(triggeredWorkflow.id);

    if (workflowData) workflow.execute(workflowData, { tabId: tab.id });
  }
}
async function checkRecordingWorkflow({ status }, { url, id }) {
  if (status === 'complete' && validateUrl(url)) {
    const { isRecording } = await browser.storage.local.get('isRecording');

    if (!isRecording) return;

    await browser.tabs.executeScript(id, {
      file: 'recordWorkflow.bundle.js',
    });
  }
}
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  checkRecordingWorkflow(changeInfo, tab);
  checkVisitWebTriggers(changeInfo, tab);
});
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
  const currentWorkflow = await workflow.get(name);
  if (!currentWorkflow) return;

  const { data } = findTriggerBlock(JSON.parse(currentWorkflow.drawflow)) || {};
  if (data && data.type === 'interval' && data.fixedDelay) {
    const workflowState = await workflow.states.get(
      ({ workflowId }) => name === workflowId
    );

    if (workflowState) {
      let { workflowQueue } = await browser.storage.local.get('workflowQueue');
      workflowQueue = workflowQueue || [];

      if (!workflowQueue.includes(name)) {
        (workflowQueue = workflowQueue || []).push(name);
        await browser.storage.local.set({ workflowQueue });
      }

      return;
    }
  }

  workflow.execute(currentWorkflow);

  if (data && data.type === 'specific-day') {
    registerSpecificDay(currentWorkflow.id, data);
  }
});

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
      const { workflows } = await browser.storage.local.get('workflows');
      const alarmTypes = ['specific-day', 'date', 'interval'];

      for (const { trigger, drawflow, id } of workflows) {
        let workflowTrigger = trigger?.data || trigger;

        if (!trigger) {
          const flows = parseJSON(drawflow, drawflow);
          workflowTrigger = findTriggerBlock(flows)?.data;
        }

        if (!alarmTypes.includes(workflowTrigger.type)) return;

        registerWorkflowTrigger(id, { data: workflowTrigger });
      }
    }
  } catch (error) {
    console.error(error);
  }
});
browser.runtime.onStartup.addListener(async () => {
  const { onStartupTriggers, workflows } = await browser.storage.local.get([
    'onStartupTriggers',
    'workflows',
  ]);

  (onStartupTriggers || []).forEach((workflowId, index) => {
    const findWorkflow = workflows.find(({ id }) => id === workflowId);

    if (findWorkflow) {
      workflow.execute(findWorkflow);
    } else {
      onStartupTriggers.splice(index, 1);
    }
  });
  await browser.storage.local.set({ onStartupTriggers });
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

message.on('get:sender', (_, sender) => sender);
message.on('get:file', (path) => getFile(path));
message.on('get:tab-screenshot', (options) =>
  browser.tabs.captureVisibleTab(options)
);

message.on('collection:execute', (collection) => {
  const engine = new CollectionEngine(collection, {
    states: workflow.states,
    logger: workflow.logger,
  });
  engine.init();
});

message.on('workflow:execute', (workflowData) => {
  workflow.execute(workflowData, workflowData?.options || {});
});
message.on('workflow:stop', async (id) => {
  await workflow.states.stop(id);
});

browser.runtime.onMessage.addListener(message.listener());

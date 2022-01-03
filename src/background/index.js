/* eslint-disable */
import browser from 'webextension-polyfill';
import { objectHasKey } from '@/utils/helper';
import { MessageListener } from '@/utils/message';
import { registerSpecificDay } from '../utils/workflow-trigger';
import workflowState from './workflow-state';
import WorkflowState from './workflow-state2';
import CollectionEngine from './collection-engine';
import WorkflowEngine from './workflow-engine2';
import blocksHandler from './workflow-engine/blocks-handler';
import WorkflowLogger from './workflow-logger';

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
  }
};
const workflow = {
  async get(workflowId) {
    const { workflows } = await browser.storage.local.get('workflows');
    const workflow = workflows.find(({ id }) => id === workflowId);

    return workflow;
  },
  async states() {
    const states = new WorkflowState({ storage });

    return states;
  },
  async logger() {
    const logger = new WorkflowLogger({ storage });

    return logger;
  },
  async execute(workflow, options) {
    const states = await this.states();
    const logger = await this.logger();

    const engine = new WorkflowEngine(workflow, { ...options, states, blocksHandler, logger });
    engine.init();

    console.log(engine);

    return engine;
  }
};

async function checkVisitWebTriggers(states, tab) {
  const visitWebTriggers = await storage.get('visitWebTriggers');
  const triggeredWorkflow = visitWebTriggers.find(({ url, isRegex }) => {
    if (url.trim() === '') return false;

    return tab.url.match(isRegex ? new RegExp(url, 'g') : url);
  });

  if (triggeredWorkflow) {
    const workflowData = await workflow.get(triggeredWorkflow.id);

    if (workflowData) workflow.execute(workflowData);
  }
}
async function checkWorkflowStates() {
  /* check if tab is reloaded */
}
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    await checkVisitWebTriggers(null, tab);
  }
});
browser.alarms.onAlarm.addListener(({ name }) => {
  workflow.get(name).then((workflow) => {
    if (!workflow) return;

    workflow.execute(workflow);

    const triggerBlock = Object.values(
      JSON.parse(workflow.drawflow).drawflow.Home.data
    ).find((block) => block.name === 'trigger');

    if (triggerBlock?.data.type === 'specific-day') {
      registerSpecificDay(workflow.id, triggerBlock.data);
    }
  });
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    browser.storage.local
      .set({
        logs: [],
        shortcuts: {},
        workflows: [],
        collections: [],
        workflowState: {},
        isFirstTime: true,
        visitWebTriggers: [],
      })
      .then(() => {
        browser.tabs
          .create({
            active: true,
            url: browser.runtime.getURL('newtab.html#/workflows'),
          })
          .catch((error) => {
            console.error(error);
          });
      });
  }
});

const message = new MessageListener('background');

message.on('fetch:text', (url) => {
  return fetch(url).then((response) => response.text());
});
message.on('open:dashboard', async (url) => {
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
      await browser.tabs.reload(tab.id);
    } else {
      browser.tabs.create(tabOptions);
    }
  } catch (error) {
    console.error(error);
  }
});
message.on('get:sender', (_, sender) => {
  return sender;
});

// message.on('collection:execute', executeCollection);
message.on('collection:stop', (id) => {
  const collection = runningCollections[id];
  if (!collection) {
    workflowState.delete(id);
    return;
  }

  collection.stop();
});

// message.on('workflow:check-state', checkRunnigWorkflows);
message.on('workflow:execute', (param) => {
  workflow.execute(param);
});
message.on('workflow:stop', async (id) => {
  const states = await workflow.states();
  await states.update(id, { isDestroyed: true });
});

browser.runtime.onMessage.addListener(message.listener());

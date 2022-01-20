import browser from 'webextension-polyfill';
import { MessageListener } from '@/utils/message';
import { registerSpecificDay } from '../utils/workflow-trigger';
import WorkflowState from './workflow-state';
import CollectionEngine from './collection-engine';
import WorkflowEngine from './workflow-engine/engine';
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

    if (key === 'workflowState') {
      sessionStorage.setItem(key, JSON.stringify(value));
    }
  },
};
const workflow = {
  states: new WorkflowState({ storage }),
  logger: new WorkflowLogger({ storage }),
  async get(workflowId) {
    const { workflows } = await browser.storage.local.get('workflows');
    const findWorkflow = workflows.find(({ id }) => id === workflowId);

    return findWorkflow;
  },
  execute(workflowData, options) {
    const engine = new WorkflowEngine(workflowData, {
      ...options,
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
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    await checkVisitWebTriggers(null, tab);
  }
});
browser.alarms.onAlarm.addListener(({ name }) => {
  workflow.get(name).then((currentWorkflow) => {
    if (!currentWorkflow) return;

    workflow.execute(currentWorkflow);

    const triggerBlock = Object.values(
      JSON.parse(currentWorkflow.drawflow).drawflow.Home.data
    ).find((block) => block.name === 'trigger');

    if (triggerBlock?.data.type === 'specific-day') {
      registerSpecificDay(currentWorkflow.id, triggerBlock.data);
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
            url: browser.runtime.getURL('newtab.html#/welcome'),
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

message.on('collection:execute', (collection) => {
  const engine = new CollectionEngine(collection, {
    states: workflow.states,
    logger: workflow.logger,
  });
  engine.init();
});

message.on('workflow:execute', (param) => {
  workflow.execute(param);
});
message.on('workflow:stop', async (id) => {
  await workflow.states.stop(id);
});

browser.runtime.onMessage.addListener(message.listener());

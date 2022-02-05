import browser from 'webextension-polyfill';
import { MessageListener } from '@/utils/message';
import { registerSpecificDay } from '../utils/workflow-trigger';
import { parseJSON } from '@/utils/helper';
import WorkflowState from './workflow-state';
import CollectionEngine from './collection-engine';
import WorkflowEngine from './workflow-engine/engine';
import blocksHandler from './workflow-engine/blocks-handler';
import WorkflowLogger from './workflow-logger';
import decryptFlow, { getWorkflowPass } from '@/utils/decrypt-flow';

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
    const { workflows } = await browser.storage.local.get('workflows');
    const findWorkflow = workflows.find(({ id }) => id === workflowId);

    return findWorkflow;
  },
  execute(workflowData, options) {
    if (workflowData.isProtected) {
      const flow = parseJSON(workflowData.drawflow, null);

      if (!flow) {
        const pass = getWorkflowPass(workflowData.pass);

        workflowData.drawflow = decryptFlow(workflowData, pass);
      }
    }

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
      await browser.tabs.reload(tab.id);
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
    const allowedType = ['link', 'typed', 'form_submit'];

    if (frameId !== 0 || !allowedType.includes(transitionType)) return;

    updateRecording((recording) => {
      const lastFlow = recording.flows[recording.flows.length - 1];
      const isClickSubmit =
        lastFlow.id === 'event-click' && transitionType === 'form_submit';

      if (isClickSubmit) return;

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
  const { url, id } = await browser.tabs.get(tabId);

  if (!validateUrl(url)) return;

  updateRecording((recording) => {
    recording.activeTab = { id, url };
    recording.flows.push({
      id: 'switch-tab',
      description: url,
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
      description: validUrl,
      data: { url: validUrl },
    });
  }

  recording.activeTab = {
    url,
    id: tab.id,
  };

  await browser.storage.local.set({ recording });
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
chrome.runtime.onStartup.addListener(async () => {
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

message.on('get:sender', (_, sender) => {
  return sender;
});
message.on('get:tab-screenshot', (options) => {
  return browser.tabs.captureVisibleTab(options);
});
message.on('get:file', (path) => {
  return new Promise((resolve, reject) => {
    const isFile = /\.(.*)/.test(path);

    if (!isFile) {
      reject(new Error(`"${path}" is invalid file path.`));
      return;
    }

    const fileUrl = path.startsWith('file://') ? path : `file://${path}`;

    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 0 || xhr.status === 200) {
          const objUrl = URL.createObjectURL(xhr.response);

          resolve({ path, objUrl, type: xhr.response.type });
        } else {
          reject(new Error(xhr.statusText));
        }
      }
    };
    xhr.onerror = function () {
      reject(
        new Error(xhr.statusText || `Can't find a file with "${path}" path`)
      );
    };
    xhr.open('GET', fileUrl);
    xhr.send();
  });
});

message.on('collection:execute', (collection) => {
  const engine = new CollectionEngine(collection, {
    states: workflow.states,
    logger: workflow.logger,
  });
  engine.init();
});

message.on('workflow:execute', (workflowData) => {
  workflow.execute(workflowData);
});
message.on('workflow:stop', async (id) => {
  await workflow.states.stop(id);
});

browser.runtime.onMessage.addListener(message.listener());

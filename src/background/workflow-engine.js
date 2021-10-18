/* eslint-disable no-underscore-dangle */
import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';
import { toCamelCase } from '@/utils/helper';
import { tasks } from '@/utils/shared';
import * as blocksHandler from './blocks-handler';
import workflowState from './workflow-state';

let reloadTimeout;

function tabMessageHandler({ type, data }) {
  const listener = this.tabMessageListeners[type];

  if (listener) {
    setTimeout(() => {
      listener.callback(data);
    }, listener.delay || 0);

    if (listener.once) delete this.tabMessageListeners[type];
  }
}
function tabRemovedHandler(tabId) {
  if (tabId !== this.tabId) return;

  this.connectedTab?.onMessage.removeListener(this.tabMessageHandler);
  this.connectedTab?.disconnect();

  delete this.connectedTab;
  delete this.tabId;
}
function tabUpdatedHandler(tabId, changeInfo) {
  const listener = this.tabUpdatedListeners[tabId];

  if (listener) {
    listener.callback(tabId, changeInfo, () => {
      delete this.tabUpdatedListeners[tabId];
    });
  } else if (this.tabId === tabId) {
    if (!reloadTimeout) {
      console.log('===Register Timeout===');
      reloadTimeout = setTimeout(() => {
        this.isPaused = false;
      }, 15000);
    }

    this.isPaused = true;

    if (changeInfo.status === 'complete') {
      console.log('clearTimeout');
      clearTimeout(reloadTimeout);
      reloadTimeout = null;

      browser.tabs
        .executeScript(tabId, {
          file: './contentScript.bundle.js',
        })
        .then(() => {
          console.log(this.currentBlock);
          if (this.connectedTab) this._connectTab(this.tabId);

          this.isPaused = false;
        })
        .catch((error) => {
          console.error(error);
          this.isPaused = false;
        });
    }
  }
}

class WorkflowEngine {
  constructor(workflow) {
    this.id = nanoid();
    this.workflow = workflow;
    this.data = {};
    this.blocks = {};
    this.eventListeners = {};
    this.repeatedTasks = {};
    this.logs = [];
    this.blocksArr = [];
    this.isPaused = false;
    this.isDestroyed = false;
    this.currentBlock = null;

    this.tabMessageListeners = {};
    this.tabUpdatedListeners = {};
    this.tabMessageHandler = tabMessageHandler.bind(this);
    this.tabUpdatedHandler = tabUpdatedHandler.bind(this);
    this.tabRemovedHandler = tabRemovedHandler.bind(this);
  }

  init() {
    const drawflowData =
      typeof this.workflow.drawflow === 'string'
        ? JSON.parse(this.workflow.drawflow || '{}')
        : this.workflow.drawflow;
    const blocks = drawflowData?.drawflow.Home.data;

    if (!blocks) {
      console.error('No block is found');
      return;
    }

    const blocksArr = Object.values(blocks);
    const triggerBlock = blocksArr.find(({ name }) => name === 'trigger');

    if (!triggerBlock) {
      console.error('A trigger block is required');
      return;
    }

    browser.tabs.onUpdated.addListener(this.tabUpdatedHandler);
    browser.tabs.onRemoved.addListener(this.tabRemovedHandler);

    this.blocks = blocks;
    this.blocksArr = blocksArr;
    this.startedTimestamp = Date.now();

    workflowState.add(this.id, this.state).then(() => {
      this._blockHandler(triggerBlock);
    });
  }

  on(name, listener) {
    (this.eventListeners[name] = this.eventListeners[name] || []).push(
      listener
    );
  }

  pause(pause = true) {
    this.isPaused = pause;

    workflowState.update(this.tabId, this.state);
  }

  destroy() {
    // save log
    this.dispatchEvent('destroyed', this.workflow.id);

    this.eventListeners = {};
    this.tabMessageListeners = {};
    this.tabUpdatedListeners = {};

    browser.tabs.onRemoved.removeListener(this.tabRemovedHandler);
    browser.tabs.onUpdated.removeListener(this.tabUpdatedHandler);

    workflowState.delete(this.id);

    this.isDestroyed = true;
    this.endedTimestamp = Date.now();
  }

  dispatchEvent(name, params) {
    const listeners = this.eventListeners[name];
    console.log(name, this.eventListeners);
    if (!listeners) return;

    listeners.forEach((callback) => {
      callback(params);
    });
  }

  get state() {
    const keys = ['tabId', 'isPaused', 'isDestroyed', 'currentBlock'];

    return keys.reduce((acc, key) => {
      acc[key] = this[key];

      return acc;
    }, {});
  }

  _blockHandler(block, prevBlockData) {
    if (this.isDestroyed) {
      console.log(
        '%cDestroyed',
        'color: red; font-size: 24px; font-weight: bold'
      );
      return;
    }
    if (this.isPaused) {
      console.log(this.isPaused, 'pause');
      setTimeout(() => {
        this._blockHandler(block, prevBlockData);
      }, 1000);

      return;
    }

    workflowState.update(this.id, this.state);
    console.log(`${block.name}:`, block);

    this.currentBlock = block;

    const isInteraction = tasks[block.name].category === 'interaction';
    const handlerName = isInteraction
      ? 'interactionHandler'
      : toCamelCase(block?.name);
    const handler = blocksHandler[handlerName];

    if (handler) {
      handler
        .call(this, block, prevBlockData)
        .then((result) => {
          if (result.nextBlockId) {
            this._blockHandler(this.blocks[result.nextBlockId], result.data);
          } else {
            this.dispatchEvent('finish');
            this.destroy();
            console.log('Done', this);
          }
        })
        .catch((error) => {
          workflowState.console.error(error, 'new');
        });
    } else {
      console.error(`"${block.name}" block doesn't have a handler`);
    }
  }

  _connectTab(tabId) {
    const connectedTab = browser.tabs.connect(tabId, {
      name: `${this.workflow.id}--${this.workflow.name.slice(0, 10)}`,
    });

    if (this.connectedTab) {
      this.connectedTab.onMessage.removeListener(this.tabMessageHandler);
      this.connectedTab.disconnect();
    }

    connectedTab.onMessage.addListener(this.tabMessageHandler);

    this.connectedTab = connectedTab;
    this.tabId = tabId;

    return connectedTab;
  }

  _listener({ id, name, callback, once = true, ...options }) {
    const listenerNames = {
      event: 'eventListener',
      'tab-updated': 'tabUpdatedListeners',
      'tab-message': 'tabMessageListeners',
    };
    this[listenerNames[name]][id] = { callback, once, ...options };

    return () => {
      delete this.tabMessageListeners[id];
    };
  }
}

export default WorkflowEngine;

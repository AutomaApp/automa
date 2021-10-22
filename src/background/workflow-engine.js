/* eslint-disable no-underscore-dangle */
import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';
import { toCamelCase } from '@/utils/helper';
import { tasks } from '@/utils/shared';
import errorMessage from './error-message';
import workflowState from './workflow-state';
import * as blocksHandler from './blocks-handler';

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

  if (tasks[this.currentBlock.name].category === 'interaction') {
    this.destroy('error');
  }
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
  constructor(workflow, tabId = null) {
    this.id = nanoid();
    this.tabId = tabId;
    this.workflow = workflow;
    this.data = {};
    this.blocks = {};
    this.eventListeners = {};
    this.repeatedTasks = {};
    this.logs = [];
    this.isPaused = false;
    this.isDestroyed = false;
    this.currentBlock = null;
    this.workflowTimeout = null;

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
      console.error(errorMessage('no-block', this.workflow));
      return;
    }

    const blocksArr = Object.values(blocks);
    const triggerBlock = blocksArr.find(({ name }) => name === 'trigger');

    if (!triggerBlock) {
      console.error(errorMessage('no-trigger-block', this.workflow));
      return;
    }

    browser.tabs.onUpdated.addListener(this.tabUpdatedHandler);
    browser.tabs.onRemoved.addListener(this.tabRemovedHandler);

    this.blocks = blocks;
    this.startedTimestamp = Date.now();

    workflowState
      .add(this.id, {
        workflowId: this.workflow.id,
        state: this.state,
      })
      .then(() => {
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

    workflowState.update(this.id, this.state);
  }

  stop(message) {
    this.logs.push({
      message,
      type: 'stop',
      name: 'Workflow is stopped',
    });
    this.destroy('stopped');
  }

  async destroy(status) {
    try {
      this.eventListeners = {};
      this.tabMessageListeners = {};
      this.tabUpdatedListeners = {};

      await browser.tabs.onRemoved.removeListener(this.tabRemovedHandler);
      await browser.tabs.onUpdated.removeListener(this.tabUpdatedHandler);

      await workflowState.delete(this.id);

      clearTimeout(this.workflowTimeout);
      this.isDestroyed = true;
      this.endedTimestamp = Date.now();

      if (!this.workflow.isTesting) {
        const { logs } = await browser.storage.local.get('logs');
        const { name, icon, id } = this.workflow;

        logs.push({
          name,
          icon,
          status,
          id: this.id,
          workflowId: id,
          data: this.data,
          history: this.logs,
          endedAt: this.endedTimestamp,
          startedAt: this.startedTimestamp,
        });

        await browser.storage.local.set({ logs });
      }

      this.dispatchEvent('destroyed', this.workflow.id);
    } catch (error) {
      console.error(error);
    }
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

    this.workflowTimeout = setTimeout(() => {
      if (!this.isDestroyed) this.stop('Workflow stopped because of timeout');
    }, this.workflow.settings.timeout || 120000);

    workflowState.update(this.id, this.state);
    console.log(`${block.name}:`, block);

    this.currentBlock = block;

    const started = Date.now();
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
            this.logs.push({
              type: 'success',
              name: tasks[block.name].name,
              data: result.data,
              duration: Math.round(Date.now() - started),
            });

            this._blockHandler(this.blocks[result.nextBlockId], result.data);
          } else {
            this.logs.push({
              type: 'finish',
              message: 'Workflow finished running',
              name: 'Finish',
            });
            this.dispatchEvent('finish');
            this.destroy('success');
            console.log('Done', this);
          }

          clearTimeout(this.workflowTimeout);
          this.workflowTimeout = null;
        })
        .catch((error) => {
          this.logs.push({
            type: 'error',
            message: error.message,
            name: tasks[block.name].name,
          });
          console.dir(error);
          if (
            this.workflow.settings.onError === 'keep-running' &&
            error.nextBlockId
          ) {
            this._blockHandler(
              this.blocks[error.nextBlockId],
              error.data || ''
            );
          } else {
            this.destroy('error');
          }

          clearTimeout(this.workflowTimeout);
          this.workflowTimeout = null;

          console.error(error);
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

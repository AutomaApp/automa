/* eslint-disable no-underscore-dangle */
import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';
import { toCamelCase } from '@/utils/helper';
import { tasks } from '@/utils/shared';
import errorMessage from './error-message';
import referenceData from '@/utils/reference-data';
import workflowState from '../workflow-state';
import * as blocksHandler from './blocks-handler';
import executeContentScript from '@/utils/execute-content-script';

let reloadTimeout;

function tabRemovedHandler(tabId) {
  if (tabId !== this.tabId) return;

  delete this.tabId;

  if (tasks[this.currentBlock.name].category === 'interaction') {
    this.destroy('error', 'Current active tab is removed');
  }

  workflowState.update(this.id, this.state);
}
function tabUpdatedHandler(tabId, changeInfo) {
  const listener = this.tabUpdatedListeners[tabId];

  if (listener) {
    listener.callback(tabId, changeInfo, () => {
      delete this.tabUpdatedListeners[tabId];
    });
  } else if (this.tabId === tabId) {
    if (!reloadTimeout) {
      reloadTimeout = setTimeout(() => {
        this.isPaused = false;
      }, 15000);
    }

    this.isPaused = true;

    if (changeInfo.status === 'complete') {
      clearTimeout(reloadTimeout);
      reloadTimeout = null;

      executeContentScript(tabId, 'update tab')
        .then((frames) => {
          this.tabId = tabId;
          this.frames = frames;
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
  constructor(workflow, { tabId = null, isInCollection, collectionLogId }) {
    this.id = nanoid();
    this.tabId = tabId;
    this.workflow = workflow;
    this.isInCollection = isInCollection;
    this.collectionLogId = collectionLogId;
    this.data = {};
    this.logs = [];
    this.blocks = {};
    this.frames = {};
    this.loopList = {};
    this.loopData = {};
    this.repeatedTasks = {};
    this.eventListeners = {};
    this.isPaused = false;
    this.isDestroyed = false;
    this.frameId = null;
    this.windowId = null;
    this.tabGroupId = null;
    this.currentBlock = null;
    this.workflowTimeout = null;

    this.tabUpdatedListeners = {};
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

    const dataColumns = Array.isArray(this.workflow.dataColumns)
      ? this.workflow.dataColumns
      : Object.values(this.workflow.dataColumns);

    this.blocks = blocks;
    this.startedTimestamp = Date.now();
    this.workflow.dataColumns = dataColumns;
    this.data = dataColumns.reduce(
      (acc, column) => {
        acc[column.name] = [];

        return acc;
      },
      { column: [] }
    );

    workflowState
      .add(this.id, {
        state: this.state,
        workflowId: this.workflow.id,
        isInCollection: this.isInCollection,
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

  async destroy(status, message) {
    try {
      this.dispatchEvent('destroyed', { id: this.id, status, message });

      this.eventListeners = {};
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
          isInCollection: this.isInCollection,
          collectionLogId: this.collectionLogId,
        });

        await browser.storage.local.set({ logs });
      }
    } catch (error) {
      console.error(error);
    }
  }

  dispatchEvent(name, params) {
    const listeners = this.eventListeners[name];

    if (!listeners) return;

    listeners.forEach((callback) => {
      callback(params);
    });
  }

  get state() {
    const keys = [
      'tabId',
      'isPaused',
      'isDestroyed',
      'currentBlock',
      'isInCollection',
      'startedTimestamp',
    ];
    const state = keys.reduce((acc, key) => {
      acc[key] = this[key];

      return acc;
    }, {});

    state.name = this.workflow.name;
    state.icon = this.workflow.icon;

    return state;
  }

  _blockHandler(block, prevBlockData) {
    if (this.isDestroyed) return;
    if (this.isPaused) {
      setTimeout(() => {
        this._blockHandler(block, prevBlockData);
      }, 1000);

      return;
    }

    const disableTimeoutKeys = ['delay', 'javascript-code'];

    if (!disableTimeoutKeys.includes(block.name)) {
      this.workflowTimeout = setTimeout(() => {
        if (!this.isDestroyed) this.stop('Workflow stopped because of timeout');
      }, this.workflow.settings.timeout || 120000);
    }

    this.currentBlock = block;

    workflowState.update(this.id, this.state);
    this.dispatchEvent('update', this.state);

    const started = Date.now();
    const blockHandler = blocksHandler[toCamelCase(block?.name)];
    const handler =
      !blockHandler && tasks[block.name].category === 'interaction'
        ? blocksHandler.interactionHandler
        : blockHandler;

    if (handler) {
      const replacedBlock = referenceData(block, {
        prevBlockData,
        data: this.data,
        loopData: this.loopData,
      });

      handler
        .call(this, replacedBlock, prevBlockData)
        .then((result) => {
          clearTimeout(this.workflowTimeout);
          this.workflowTimeout = null;
          this.logs.push({
            type: 'success',
            name: tasks[block.name].name,
            data: result.data,
            duration: Math.round(Date.now() - started),
          });

          if (result.nextBlockId) {
            this._blockHandler(this.blocks[result.nextBlockId], result.data);
          } else {
            this.logs.push({
              type: 'finish',
              message: 'Workflow finished running',
              name: 'Finish',
            });
            this.dispatchEvent('finish');
            this.destroy('success');
          }
        })
        .catch((error) => {
          this.logs.push({
            type: 'error',
            message: error.message,
            name: tasks[block.name].name,
          });

          if (
            this.workflow.settings.onError === 'keep-running' &&
            error.nextBlockId
          ) {
            this._blockHandler(
              this.blocks[error.nextBlockId],
              error.data || ''
            );
          } else {
            this.destroy('error', error.message);
          }

          clearTimeout(this.workflowTimeout);
          this.workflowTimeout = null;

          console.error(error);
        });
    } else {
      console.error(`"${block.name}" block doesn't have a handler`);
    }
  }

  _sendMessageToTab(block, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.tabId) {
        const message = errorMessage('no-tab', tasks[block.name]);

        reject(new Error(message));
      }

      browser.tabs
        .sendMessage(this.tabId, { isBlock: true, ...block }, options)
        .then(resolve)
        .catch(reject);
    });
  }

  _listener({ id, name, callback, once = true, ...options }) {
    const listenerNames = {
      event: 'eventListener',
      'tab-updated': 'tabUpdatedListeners',
    };
    this[listenerNames[name]][id] = { callback, once, ...options };
  }
}

export default WorkflowEngine;

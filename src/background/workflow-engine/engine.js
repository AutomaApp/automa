/* eslint-disable no-underscore-dangle */
import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';
import { tasks } from '@/utils/shared';
import { convertData } from './helper';
import { generateJSON } from '@/utils/data-exporter';
import { toCamelCase, parseJSON, isObject, objectHasKey } from '@/utils/helper';
import errorMessage from './error-message';
import referenceData from '@/utils/reference-data';
import workflowState from '../workflow-state';
import executeContentScript from './execute-content-script';

let reloadTimeout;

function tabRemovedHandler(tabId) {
  if (tabId !== this.tabId) return;

  delete this.tabId;

  if (
    this.currentBlock.name === 'new-tab' ||
    tasks[this.currentBlock.name].category === 'interaction'
  ) {
    this.destroy('error', 'active-tab-removed');
  }

  workflowState.update(this.id, this.state);
}
function tabUpdatedHandler(tabId, changeInfo, tab) {
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
          this.activeTabUrl = tab?.url || '';
        })
        .catch((error) => {
          console.error(error);
          this.isPaused = false;
        });
    }
  }
}

class WorkflowEngine {
  constructor(
    workflow,
    {
      globalData,
      tabId = null,
      isInCollection,
      collectionLogId,
      blocksHandler,
      parentWorkflow,
    }
  ) {
    const globalDataVal = globalData || workflow.globalData;

    this.id = nanoid();
    this.tabId = tabId;
    this.workflow = workflow;
    this.blocksHandler = blocksHandler;
    this.isInCollection = isInCollection;
    this.parentWorkflow = parentWorkflow;
    this.collectionLogId = collectionLogId;
    this.globalData = parseJSON(globalDataVal, globalDataVal);
    this.activeTabUrl = '';
    this.columns = { column: { index: 0, type: 'any' } };
    this.data = [];
    this.logs = [];
    this.blocks = {};
    this.frames = {};
    this.loopList = {};
    this.loopData = {};
    this.repeatedTasks = {};
    this.eventListeners = {};
    this.isPaused = false;
    this.isDestroyed = false;
    this.isUsingProxy = false;
    this.frameId = null;
    this.windowId = null;
    this.tabGroupId = null;
    this.currentBlock = null;
    this.childWorkflow = null;
    this.workflowTimeout = null;

    this.tabUpdatedListeners = {};
    this.tabUpdatedHandler = tabUpdatedHandler.bind(this);
    this.tabRemovedHandler = tabRemovedHandler.bind(this);
  }

  init() {
    if (this.workflow.isDisabled) return;

    const drawflowData =
      typeof this.workflow.drawflow === 'string'
        ? JSON.parse(this.workflow.drawflow || '{}')
        : this.workflow.drawflow;
    const blocks = drawflowData?.drawflow?.Home.data;

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

    dataColumns.forEach(({ name, type }) => {
      this.columns[name] = { index: 0, type };
    });

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

  addData(key, value) {
    if (Array.isArray(key)) {
      key.forEach((item) => {
        if (!isObject(item)) return;

        Object.entries(item).forEach(([itemKey, itemValue]) => {
          this.addData(itemKey, itemValue);
        });
      });

      return;
    }

    const columnName = objectHasKey(this.columns, key) ? key : 'column';
    const currentColumn = this.columns[columnName];
    const convertedValue = convertData(value, currentColumn.type);

    if (objectHasKey(this.data, currentColumn.index)) {
      this.data[currentColumn.index][columnName] = convertedValue;
    } else {
      this.data.push({ [columnName]: convertedValue });
    }

    currentColumn.index += 1;
  }

  addLog(detail) {
    if (this.logs.length >= 1001) return;

    this.logs.push(detail);
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

  async stop(message) {
    try {
      if (this.childWorkflow) {
        await this.childWorkflow.stop();
      }

      this.addLog({
        message,
        type: 'stop',
        name: 'stop',
      });

      await this.destroy('stopped');
    } catch (error) {
      console.error(error);
    }
  }

  async destroy(status, message) {
    try {
      if (this.isUsingProxy) chrome.proxy.settings.clear({});

      await browser.tabs.onRemoved.removeListener(this.tabRemovedHandler);
      await browser.tabs.onUpdated.removeListener(this.tabUpdatedHandler);

      await workflowState.delete(this.id);

      clearTimeout(this.workflowTimeout);
      this.isDestroyed = true;
      this.endedTimestamp = Date.now();

      if (!this.workflow.isTesting) {
        const { logs } = await browser.storage.local.get('logs');
        const { name, icon, id } = this.workflow;
        const jsonData = generateJSON(Object.keys(this.data), this.data);

        logs.push({
          name,
          icon,
          status,
          message,
          id: this.id,
          workflowId: id,
          data: jsonData,
          history: this.logs,
          endedAt: this.endedTimestamp,
          startedAt: this.startedTimestamp,
          isChildLog: !!this.parentWorkflow,
          isInCollection: this.isInCollection,
          collectionLogId: this.collectionLogId,
        });

        await browser.storage.local.set({ logs });
      }

      this.dispatchEvent('destroyed', {
        id: this.id,
        status,
        message,
        currentBlock: this.currentBlock,
      });

      this.eventListeners = {};
      this.tabUpdatedListeners = {};
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

    if (this.parentWorkflow) state.parentState = this.parentWorkflow;

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
        if (!this.isDestroyed) this.stop('stop-timeout');
      }, this.workflow.settings.timeout || 120000);
    }

    this.currentBlock = block;

    workflowState.update(this.id, this.state);
    this.dispatchEvent('update', this.state);

    const started = Date.now();
    const blockHandler = this.blocksHandler[toCamelCase(block?.name)];
    const handler =
      !blockHandler && tasks[block.name].category === 'interaction'
        ? this.blocksHandler.interactionBlock
        : blockHandler;

    if (handler) {
      const replacedBlock = referenceData(block, {
        prevBlockData,
        data: this.data,
        loopData: this.loopData,
        globalData: this.globalData,
        activeTabUrl: this.activeTabUrl,
      });

      handler
        .call(this, replacedBlock, prevBlockData)
        .then((result) => {
          clearTimeout(this.workflowTimeout);
          this.workflowTimeout = null;
          this.addLog({
            type: 'success',
            name: block.name,
            logId: result.logId,
            duration: Math.round(Date.now() - started),
          });

          if (result.nextBlockId) {
            this._blockHandler(this.blocks[result.nextBlockId], result.data);
          } else {
            this.addLog({
              type: 'finish',
              name: 'finish',
            });
            this.dispatchEvent('finish');
            this.destroy('success');
          }
        })
        .catch((error) => {
          this.addLog({
            type: 'error',
            message: error.message,
            name: block.name,
            ...(error.data || {}),
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

  _sendMessageToTab(payload, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.tabId) {
        const error = new Error('no-tab');
        error.workflowId = this.id;

        reject(error);
        return;
      }

      browser.tabs
        .sendMessage(this.tabId, { isBlock: true, ...payload }, options)
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

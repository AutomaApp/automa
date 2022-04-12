import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';
import { tasks } from '@/utils/shared';
import {
  clearCache,
  toCamelCase,
  sleep,
  parseJSON,
  isObject,
  objectHasKey,
} from '@/utils/helper';
import referenceData from '@/utils/reference-data';
import { convertData, waitTabLoaded, getBlockConnection } from './helper';
import executeContentScript from './execute-content-script';

class WorkflowEngine {
  constructor(
    workflow,
    { states, logger, blocksHandler, parentWorkflow, options }
  ) {
    this.id = nanoid();
    this.states = states;
    this.logger = logger;
    this.workflow = workflow;
    this.blocksHandler = blocksHandler;
    this.parentWorkflow = parentWorkflow;
    this.saveLog = workflow.settings?.saveLog ?? true;

    this.loopList = {};
    this.repeatedTasks = {};

    this.windowId = null;
    this.triggerBlock = null;
    this.currentBlock = null;
    this.childWorkflowId = null;

    this.isDestroyed = false;
    this.isUsingProxy = false;

    this.blocks = {};
    this.history = [];
    this.columnsId = {};
    this.historyCtxData = {};
    this.eventListeners = {};
    this.preloadScripts = [];
    this.columns = { column: { index: 0, name: 'column', type: 'any' } };

    let variables = {};
    let { globalData } = workflow;

    if (options && options?.data) {
      globalData = options.data.globalData;
      variables = isObject(options.data.variables)
        ? options?.data.variables
        : {};

      options.data = { globalData, variables };
    }
    this.options = options;

    this.activeTab = {
      url: '',
      frameId: 0,
      frames: {},
      groupId: null,
      id: options?.tabId,
    };
    this.referenceData = {
      variables,
      table: [],
      loopData: {},
      workflow: {},
      googleSheets: {},
      globalData: parseJSON(globalData, globalData),
    };

    this.onDebugEvent = ({ tabId }, method, params) => {
      if (tabId !== this.activeTab.id) return;

      (this.eventListeners[method] || []).forEach((listener) => {
        listener(params);
      });
    };
    this.onWorkflowStopped = (id) => {
      if (this.id !== id || this.isDestroyed) return;
      this.stop();
    };
  }

  reset() {
    this.loopList = {};
    this.repeatedTasks = {};

    this.windowId = null;
    this.currentBlock = null;
    this.childWorkflowId = null;

    this.isDestroyed = false;
    this.isUsingProxy = false;

    this.history = [];
    this.preloadScripts = [];
    this.columns = { column: { index: 0, name: 'column', type: 'any' } };

    this.activeTab = {
      url: '',
      frameId: 0,
      frames: {},
      groupId: null,
      id: this.options?.tabId,
    };
    this.referenceData = {
      table: [],
      loopData: {},
      workflow: {},
      googleSheets: {},
      variables: this.options.variables,
      globalData: this.referenceData.globalData,
    };
  }

  init() {
    if (this.workflow.isDisabled) return;

    if (!this.states) {
      console.error(`"${this.workflow.name}" workflow doesn't have states`);
      this.destroy('error');
      return;
    }

    const flow = this.workflow.drawflow;
    const parsedFlow = typeof flow === 'string' ? parseJSON(flow, {}) : flow;
    const blocks = parsedFlow?.drawflow?.Home.data;

    if (!blocks) {
      console.error(`${this.workflow.name} doesn't have blocks`);
      return;
    }

    const triggerBlock = Object.values(blocks).find(
      ({ name }) => name === 'trigger'
    );
    if (!triggerBlock) {
      console.error(`${this.workflow.name} doesn't have a trigger block`);
      return;
    }

    const workflowTable = this.workflow.table || this.workflow.dataColumns;
    const columns = Array.isArray(workflowTable)
      ? workflowTable
      : Object.values(workflowTable);

    columns.forEach(({ name, type, id }) => {
      const columnId = id || name;

      this.columnsId[name] = columnId;
      this.columns[columnId] = { index: 0, name, type };
    });

    if (this.workflow.settings.debugMode) {
      chrome.debugger.onEvent.addListener(this.onDebugEvent);
    }
    if (this.workflow.settings.reuseLastState) {
      const lastStateKey = `last-state:${this.workflow.id}`;
      browser.storage.local.get(lastStateKey).then((value) => {
        const lastState = value[lastStateKey];

        if (!lastState) return;

        this.columns = lastState.columns;
        Object.assign(this.referenceData, lastState.referenceData);
      });
    }

    this.blocks = blocks;
    this.startedTimestamp = Date.now();
    this.workflow.table = columns;
    this.currentBlock = triggerBlock;

    this.states.on('stop', this.onWorkflowStopped);

    this.states
      .add(this.id, {
        state: this.state,
        workflowId: this.workflow.id,
        parentState: this.parentWorkflow,
      })
      .then(() => {
        this.executeBlock(this.currentBlock);
      });
  }

  resume({ id, state }) {
    this.id = id;

    Object.keys(state).forEach((key) => {
      this[key] = state[key];
    });

    this.init(state.currentBlock);
  }

  addLogHistory(detail) {
    if (
      !this.saveLog &&
      (this.history.length >= 1001 || detail.name === 'blocks-group') &&
      detail.type !== 'error'
    )
      return;

    const historyId = nanoid();
    detail.id = historyId;

    if (
      detail.replacedValue ||
      (tasks[detail.name]?.refDataKeys && this.saveLog)
    ) {
      const { activeTabUrl, variables, loopData, prevBlockData } = JSON.parse(
        JSON.stringify(this.referenceData)
      );

      this.historyCtxData[historyId] = {
        referenceData: {
          loopData,
          variables,
          activeTabUrl,
          prevBlockData,
        },
        replacedValue: detail.replacedValue,
      };

      delete detail.replacedValue;
    }

    this.history.push(detail);
  }

  addDataToColumn(key, value) {
    if (Array.isArray(key)) {
      key.forEach((item) => {
        if (!isObject(item)) return;

        Object.entries(item).forEach(([itemKey, itemValue]) => {
          this.addDataToColumn(itemKey, itemValue);
        });
      });

      return;
    }

    const columnId =
      (this.columns[key] ? key : this.columnsId[key]) || 'column';
    const currentColumn = this.columns[columnId];
    const columnName = currentColumn.name || 'column';
    const convertedValue = convertData(value, currentColumn.type);

    if (objectHasKey(this.referenceData.table, currentColumn.index)) {
      this.referenceData.table[currentColumn.index][columnName] =
        convertedValue;
    } else {
      this.referenceData.table.push({ [columnName]: convertedValue });
    }

    currentColumn.index += 1;
  }

  setVariable(name, value) {
    this.referenceData.variables[name] = value;
  }

  async stop() {
    try {
      if (this.childWorkflowId) {
        await this.states.stop(this.childWorkflowId);
      }

      await this.destroy('stopped');
    } catch (error) {
      console.error(error);
    }
  }

  async executeQueue() {
    const { workflowQueue } = await browser.storage.local.get('workflowQueue');
    const queueIndex = (workflowQueue || []).indexOf(this.workflow.id);

    if (!workflowQueue || queueIndex === -1) return;

    const engine = new WorkflowEngine(this.workflow, {
      logger: this.logger,
      states: this.states,
      blocksHandler: this.blocksHandler,
    });
    engine.init();

    workflowQueue.splice(queueIndex, 1);

    await browser.storage.local.set({ workflowQueue });
  }

  async destroy(status, message) {
    try {
      if (this.isDestroyed) return;
      if (this.isUsingProxy) chrome.proxy.settings.clear({});
      if (this.workflow.settings.debugMode) {
        chrome.debugger.onEvent.removeListener(this.onDebugEvent);

        if (this.activeTab.id) {
          await sleep(1000);
          chrome.debugger.detach({ tabId: this.activeTab.id });
        }
      }

      const endedTimestamp = Date.now();
      this.executeQueue();

      if (!this.workflow.isTesting) {
        const { name, id } = this.workflow;

        let { logsCtxData } = await browser.storage.local.get('logsCtxData');
        if (!logsCtxData) logsCtxData = {};
        logsCtxData[this.id] = this.historyCtxData;
        await browser.storage.local.set({ logsCtxData });

        await this.logger.add({
          name,
          status,
          message,
          id: this.id,
          workflowId: id,
          history: this.saveLog ? this.history : [],
          endedAt: endedTimestamp,
          parentLog: this.parentWorkflow,
          startedAt: this.startedTimestamp,
          data: {
            table: this.referenceData.table,
            variables: this.referenceData.variables,
          },
        });
      }

      this.states.off('stop', this.onWorkflowStopped);
      await this.states.delete(this.id);

      this.dispatchEvent('destroyed', {
        status,
        message,
        id: this.id,
        currentBlock: this.currentBlock,
      });

      if (this.workflow.settings.reuseLastState) {
        browser.storage.local.set({
          [`last-state:${this.workflow.id}`]: {
            columns: this.columns,
            referenceData: {
              table: this.referenceData.table,
              variables: this.referenceData.variables,
              globalData: this.referenceData.globalData,
            },
          },
        });
      }

      if (status === 'success') clearCache(this.workflow);

      this.isDestroyed = true;
      this.eventListeners = {};
    } catch (error) {
      console.error(error);
    }
  }

  async executeBlock(block, prevBlockData, isRetry) {
    const currentState = await this.states.get(this.id);

    if (!currentState || currentState.isDestroyed) {
      if (this.isDestroyed) return;

      await this.destroy('stopped');
      return;
    }

    this.currentBlock = block;
    this.referenceData.prevBlockData = prevBlockData;
    this.referenceData.activeTabUrl = this.activeTab.url || '';

    if (!isRetry) {
      await this.states.update(this.id, { state: this.state });
      this.dispatchEvent('update', { state: this.state });
    }

    const startExecuteTime = Date.now();

    const blockHandler = this.blocksHandler[toCamelCase(block.name)];
    const handler =
      !blockHandler && tasks[block.name].category === 'interaction'
        ? this.blocksHandler.interactionBlock
        : blockHandler;

    if (!handler) {
      console.error(`"${block.name}" block doesn't have a handler`);
      this.destroy('stopped');
      return;
    }

    const replacedBlock = referenceData({
      block,
      data: this.referenceData,
      refKeys: isRetry ? null : tasks[block.name].refDataKeys,
    });
    const blockDelay = this.workflow.settings?.blockDelay || 0;
    const addBlockLog = (status, obj = {}) => {
      this.addLogHistory({
        type: status,
        name: block.name,
        description: block.data.description,
        replacedValue: replacedBlock.replacedValue,
        duration: Math.round(Date.now() - startExecuteTime),
        ...obj,
      });
    };

    try {
      const result = await handler.call(this, replacedBlock, {
        prevBlockData,
        refData: this.referenceData,
      });

      if (result.replacedValue)
        replacedBlock.replacedValue = result.replacedValue;

      addBlockLog(result.status || 'success', {
        logId: result.logId,
      });

      if (result.nextBlockId) {
        setTimeout(() => {
          this.executeBlock(this.blocks[result.nextBlockId], result.data);
        }, blockDelay);
      } else {
        this.addLogHistory({
          type: 'finish',
          name: 'finish',
        });
        this.dispatchEvent('finish');
        this.destroy('success');
      }
    } catch (error) {
      const { onError: blockOnError } = replacedBlock.data;
      if (blockOnError && blockOnError.enable) {
        if (blockOnError.retry && blockOnError.retryTimes) {
          await sleep(blockOnError.retryInterval * 1000);
          blockOnError.retryTimes -= 1;
          await this.executeBlock(replacedBlock, prevBlockData, true);

          return;
        }

        const nextBlockId = getBlockConnection(
          block,
          blockOnError.toDo === 'continue' ? 1 : 2
        );
        if (blockOnError.toDo !== 'error' && nextBlockId) {
          this.executeBlock(this.blocks[nextBlockId], '');
          return;
        }
      }

      addBlockLog('error', {
        message: error.message,
        ...(error.data || {}),
      });

      const { onError } = this.workflow.settings;

      if (onError === 'keep-running' && error.nextBlockId) {
        setTimeout(() => {
          this.executeBlock(this.blocks[error.nextBlockId], error.data || '');
        }, blockDelay);
      } else if (onError === 'restart-workflow' && !this.parentWorkflow) {
        const restartKey = `restart-count:${this.id}`;
        const restartCount = +localStorage.getItem(restartKey) || 0;
        const maxRestart = this.workflow.settings.restartTimes ?? 3;

        if (restartCount >= maxRestart) {
          localStorage.removeItem(restartKey);
          this.destroy();
          return;
        }

        this.reset();

        const triggerBlock = Object.values(this.blocks).find(
          ({ name }) => name === 'trigger'
        );
        this.executeBlock(triggerBlock);

        localStorage.setItem(restartKey, restartCount + 1);
      } else {
        this.destroy('error', error.message);
      }

      console.error(`${block.name}:`, error);
    }
  }

  dispatchEvent(name, params) {
    const listeners = this.eventListeners[name];

    if (!listeners) return;

    listeners.forEach((callback) => {
      callback(params);
    });
  }

  on(name, listener) {
    (this.eventListeners[name] = this.eventListeners[name] || []).push(
      listener
    );
  }

  get state() {
    const keys = [
      'history',
      'columns',
      'activeTab',
      'isUsingProxy',
      'currentBlock',
      'referenceData',
      'childWorkflowId',
      'startedTimestamp',
    ];
    const state = {
      name: this.workflow.name,
      icon: this.workflow.icon,
    };

    keys.forEach((key) => {
      state[key] = this[key];
    });

    return state;
  }

  async _sendMessageToTab(payload, options = {}) {
    try {
      if (!this.activeTab.id) {
        const error = new Error('no-tab');
        error.workflowId = this.id;

        throw error;
      }

      await waitTabLoaded(this.activeTab.id);
      await executeContentScript(
        this.activeTab.id,
        this.activeTab.frameId || 0
      );

      const { executedBlockOnWeb, debugMode } = this.workflow.settings;
      const messagePayload = {
        isBlock: true,
        debugMode,
        executedBlockOnWeb,
        activeTabId: this.activeTab.id,
        frameSelector: this.frameSelector,
        ...payload,
      };

      const data = await browser.tabs.sendMessage(
        this.activeTab.id,
        messagePayload,
        { frameId: this.activeTab.frameId, ...options }
      );

      return data;
    } catch (error) {
      if (error.message?.startsWith('Could not establish connection')) {
        error.message = 'Could not establish connection to the active tab';
      } else if (error.message?.startsWith('No tab')) {
        error.message = 'active-tab-removed';
      }

      throw error;
    }
  }
}

export default WorkflowEngine;

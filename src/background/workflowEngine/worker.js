import browser from 'webextension-polyfill';
import { toCamelCase, sleep, objectHasKey, isObject } from '@/utils/helper';
import { tasks } from '@/utils/shared';
import referenceData from '@/utils/referenceData';
import injectContentScript from './injectContentScript';
import { convertData, waitTabLoaded } from './helper';

class Worker {
  constructor(id, engine) {
    this.id = id;
    this.engine = engine;
    this.settings = engine.workflow.settings;

    this.loopEls = [];
    this.loopList = {};
    this.repeatedTasks = {};
    this.preloadScripts = [];

    this.windowId = null;
    this.currentBlock = null;
    this.childWorkflowId = null;

    this.debugAttached = false;

    this.activeTab = {
      url: '',
      frameId: 0,
      frames: {},
      groupId: null,
      id: engine.options?.tabId,
    };
  }

  init({ blockId, prevBlockData, state }) {
    if (state) {
      Object.keys(state).forEach((key) => {
        this[key] = state[key];
      });
    }

    const block = this.engine.blocks[blockId];
    this.executeBlock(block, prevBlockData);
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

    const insertDefault = this.settings.insertDefaultColumn ?? true;
    const columnId =
      (this.engine.columns[key] ? key : this.engine.columnsId[key]) || 'column';

    if (columnId === 'column' && !insertDefault) return;

    const currentColumn = this.engine.columns[columnId];
    const columnName = currentColumn.name || 'column';
    const convertedValue = convertData(value, currentColumn.type);

    if (objectHasKey(this.engine.referenceData.table, currentColumn.index)) {
      this.engine.referenceData.table[currentColumn.index][columnName] =
        convertedValue;
    } else {
      this.engine.referenceData.table.push({
        [columnName]: convertedValue,
      });
    }

    currentColumn.index += 1;
  }

  setVariable(name, value) {
    this.engine.referenceData.variables[name] = value;
  }

  getBlockConnections(blockId, outputIndex = 1) {
    const outputId = `${blockId}-output-${outputIndex}`;
    return this.engine.connectionsMap[outputId] || null;
  }

  executeNextBlocks(connections, prevBlockData) {
    connections.forEach((nodeId, index) => {
      if (index === 0) {
        this.executeBlock(this.engine.blocks[nodeId], prevBlockData);
      } else {
        const state = structuredClone({
          windowId: this.windowId,
          loopList: this.loopList,
          activeTab: this.activeTab,
          currentBlock: this.currentBlock,
          repeatedTasks: this.repeatedTasks,
          preloadScripts: this.preloadScripts,
        });

        this.engine.addWorker({
          state,
          prevBlockData,
          blockId: nodeId,
        });
      }
    });
  }

  async executeBlock(block, prevBlockData, isRetry) {
    const currentState = await this.engine.states.get(this.engine.id);

    if (!currentState || currentState.isDestroyed) {
      if (this.engine.isDestroyed) return;

      await this.engine.destroy('stopped');
      return;
    }

    const startExecuteTime = Date.now();
    const prevBlock = this.currentBlock;
    this.currentBlock = { ...block, startedAt: startExecuteTime };

    if (!isRetry) {
      await this.engine.updateState({
        activeTabUrl: this.activeTab.url,
        childWorkflowId: this.childWorkflowId,
      });
    }

    const blockHandler = this.engine.blocksHandler[toCamelCase(block.label)];
    const handler =
      !blockHandler && tasks[block.label].category === 'interaction'
        ? this.engine.blocksHandler.interactionBlock
        : blockHandler;

    if (!handler) {
      this.engine.destroy('stopped');
      return;
    }

    const refData = {
      prevBlockData,
      ...this.engine.referenceData,
      activeTabUrl: this.activeTab.url,
    };

    const replacedBlock = referenceData({
      block,
      data: refData,
      refKeys:
        isRetry || block.data.disableBlock
          ? null
          : tasks[block.label].refDataKeys,
    });
    const blockDelay = this.settings?.blockDelay || 0;
    const addBlockLog = (status, obj = {}) => {
      this.engine.addLogHistory({
        prevBlockData,
        type: status,
        name: block.label,
        blockId: block.id,
        workerId: this.id,
        description: block.data.description,
        replacedValue: replacedBlock.replacedValue,
        duration: Math.round(Date.now() - startExecuteTime),
        ...obj,
      });
    };

    try {
      let result;

      if (block.data.disableBlock) {
        result = {
          data: '',
          nextBlockId: this.getBlockConnections(block.id),
        };
      } else {
        result = await handler.call(this, replacedBlock, {
          refData,
          prevBlock,
          prevBlockData,
        });

        if (result.replacedValue) {
          replacedBlock.replacedValue = result.replacedValue;
        }

        addBlockLog(result.status || 'success', {
          logId: result.logId,
        });
      }

      if (result.nextBlockId && !result.destroyWorker) {
        setTimeout(() => {
          this.executeNextBlocks(result.nextBlockId, result.data);
        }, blockDelay);
      } else {
        this.engine.destroyWorker(this.id);
      }
    } catch (error) {
      console.error(error);
      const { onError: blockOnError } = replacedBlock.data;
      if (blockOnError && blockOnError.enable) {
        if (blockOnError.retry && blockOnError.retryTimes) {
          await sleep(blockOnError.retryInterval * 1000);
          blockOnError.retryTimes -= 1;
          await this.executeBlock(replacedBlock, prevBlockData, true);

          return;
        }

        const nextBlocks = this.getBlockConnections(
          block.id,
          blockOnError.toDo === 'continue' ? 1 : 'fallback'
        );
        if (blockOnError.toDo !== 'error' && nextBlocks) {
          addBlockLog('error', {
            message: error.message,
            ...(error.data || {}),
          });

          this.executeNextBlocks(nextBlocks, prevBlockData);

          return;
        }
      }

      const errorLogItem = { message: error.message, ...(error.data || {}) };
      addBlockLog('error', errorLogItem);

      errorLogItem.blockId = block.id;

      const { onError } = this.settings;
      const nodeConnections = this.getBlockConnections(block.id);

      if (onError === 'keep-running' && nodeConnections) {
        setTimeout(() => {
          this.executeNextBlocks(nodeConnections, error.data || '');
        }, blockDelay);
      } else if (onError === 'restart-workflow' && !this.parentWorkflow) {
        const restartKey = `restart-count:${this.id}`;
        const restartCount = +localStorage.getItem(restartKey) || 0;
        const maxRestart = this.settings.restartTimes ?? 3;

        if (restartCount >= maxRestart) {
          localStorage.removeItem(restartKey);
          this.engine.destroy('error', error.message, errorLogItem);
          return;
        }

        this.reset();

        const triggerBlock = this.engine.blocks[this.engine.triggerBlockId];
        this.executeBlock(triggerBlock);

        localStorage.setItem(restartKey, restartCount + 1);
      } else {
        this.engine.destroy('error', error.message, errorLogItem);
      }
    }
  }

  reset() {
    this.loopList = {};
    this.repeatedTasks = {};

    this.windowId = null;
    this.currentBlock = null;
    this.childWorkflowId = null;

    this.engine.history = [];
    this.engine.preloadScripts = [];
    this.engine.columns = {
      column: {
        index: 0,
        type: 'any',
        name: this.settings?.defaultColumnName || 'column',
      },
    };

    this.activeTab = {
      url: '',
      frameId: 0,
      frames: {},
      groupId: null,
      id: this.options?.tabId,
    };
    this.engine.referenceData = {
      table: [],
      loopData: {},
      workflow: {},
      googleSheets: {},
      variables: this.engine.options?.variables || {},
      globalData: this.engine.referenceData.globalData,
    };
  }

  async _sendMessageToTab(payload, options = {}, runBeforeLoad = false) {
    try {
      if (!this.activeTab.id) {
        const error = new Error('no-tab');
        error.workflowId = this.id;

        throw error;
      }

      if (!runBeforeLoad) {
        await waitTabLoaded({
          tabId: this.activeTab.id,
          ms: this.settings?.tabLoadTimeout ?? 30000,
        });
      }

      const { executedBlockOnWeb, debugMode } = this.settings;
      const messagePayload = {
        isBlock: true,
        debugMode,
        executedBlockOnWeb,
        loopEls: this.loopEls,
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
      console.error(error);
      const noConnection = error.message?.includes(
        'Could not establish connection'
      );
      const channelClosed = error.message?.includes('message channel closed');

      if (noConnection || channelClosed) {
        const isScriptInjected = await injectContentScript(
          this.activeTab.id,
          this.activeTab.frameId
        );

        if (isScriptInjected) {
          const result = await this._sendMessageToTab(
            payload,
            options,
            runBeforeLoad
          );
          return result;
        }
        error.message = 'Could not establish connection to the active tab';
      } else if (error.message?.startsWith('No tab')) {
        error.message = 'active-tab-removed';
      }

      throw error;
    }
  }
}

export default Worker;

import browser from 'webextension-polyfill';
import cloneDeep from 'lodash.clonedeep';
import {
  toCamelCase,
  sleep,
  objectHasKey,
  parseJSON,
  isObject,
} from '@/utils/helper';
import templating from './templating';
import renderString from './templating/renderString';
import { convertData, waitTabLoaded } from './helper';
import injectContentScript from './injectContentScript';

function blockExecutionWrapper(blockHandler, blockData) {
  return new Promise((resolve, reject) => {
    let timeout = null;
    const timeoutMs = blockData?.settings?.blockTimeout;
    if (timeoutMs && timeoutMs > 0) {
      timeout = setTimeout(() => {
        reject(new Error('Timeout'));
      }, timeoutMs);
    }

    blockHandler()
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      })
      .finally(() => {
        if (timeout) clearTimeout(timeout);
      });
  });
}

class WorkflowWorker {
  constructor(id, engine, options = {}) {
    this.id = id;
    this.engine = engine;
    this.settings = engine.workflow.settings;
    this.blocksDetail = options.blocksDetail || {};

    this.loopEls = [];
    this.loopList = {};
    this.repeatedTasks = {};
    this.preloadScripts = [];
    this.breakpointState = null;

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

  init({ blockId, execParam, state }) {
    if (state) {
      Object.keys(state).forEach((key) => {
        this[key] = state[key];
      });
    }

    const block = this.engine.blocks[blockId];
    this.executeBlock(block, execParam);
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
    const vars = this.engine.referenceData.variables;

    if (name.startsWith('$push:')) {
      const { 1: varName } = name.split('$push:');

      if (!objectHasKey(vars, varName)) vars[varName] = [];
      else if (!Array.isArray(vars[varName])) vars[varName] = [vars[varName]];

      vars[varName].push(value);
    }

    vars[name] = value;
    this.engine.addRefDataSnapshot('variables');
  }

  getBlockConnections(blockId, outputIndex = 1) {
    if (this.engine.isDestroyed) return null;

    const outputId = `${blockId}-output-${outputIndex}`;
    const connections = this.engine.connectionsMap[outputId];

    if (!connections) return null;

    return [...connections.values()];
  }

  executeNextBlocks(
    connections,
    prevBlockData,
    nextBlockBreakpointCount = null
  ) {
    connections.forEach((connection, index) => {
      const { id, targetHandle, sourceHandle } =
        typeof connection === 'string'
          ? { id: connection, targetHandle: '', sourceHandle: '' }
          : connection;
      const execParam = {
        prevBlockData,
        targetHandle,
        sourceHandle,
        nextBlockBreakpointCount,
      };

      if (index === 0) {
        this.executeBlock(this.engine.blocks[id], {
          prevBlockData,
          ...execParam,
        });
      } else {
        const state = cloneDeep({
          windowId: this.windowId,
          loopList: this.loopList,
          activeTab: this.activeTab,
          currentBlock: this.currentBlock,
          repeatedTasks: this.repeatedTasks,
          preloadScripts: this.preloadScripts,
        });

        this.engine.addWorker({
          state,
          execParam,
          blockId: id,
        });
      }
    });
  }

  resume(nextBlock) {
    if (!this.breakpointState) return;

    const { block, execParam, isRetry } = this.breakpointState;
    const payload = { ...execParam, resume: true };

    payload.nextBlockBreakpointCount = nextBlock ? 1 : null;

    this.executeBlock(block, payload, isRetry);

    this.breakpointState = null;
  }

  async executeBlock(block, execParam = {}, isRetry = false) {
    const currentState = await this.engine.states.get(this.engine.id);

    if (!currentState || currentState.isDestroyed) {
      if (this.engine.isDestroyed) return;

      await this.engine.destroy('stopped');
      return;
    }

    const startExecuteTime = Date.now();
    const prevBlock = this.currentBlock;
    this.currentBlock = { ...block, startedAt: startExecuteTime };

    const isInBreakpoint =
      this.engine.isTestingMode &&
      ((block.data?.$breakpoint && !execParam.resume) ||
        execParam.nextBlockBreakpointCount === 0);

    if (!isRetry) {
      const payload = {
        activeTabUrl: this.activeTab.url,
        childWorkflowId: this.childWorkflowId,
        nextBlockBreakpoint: Boolean(execParam.nextBlockBreakpointCount),
      };
      if (isInBreakpoint && currentState.status !== 'breakpoint')
        payload.status = 'breakpoint';

      await this.engine.updateState(payload);
    }

    if (execParam.nextBlockBreakpointCount) {
      execParam.nextBlockBreakpointCount -= 1;
    }

    if (isInBreakpoint || currentState.status === 'breakpoint') {
      this.engine.isInBreakpoint = true;
      this.breakpointState = { block, execParam, isRetry };

      return;
    }

    const blockHandler = this.engine.blocksHandler[toCamelCase(block.label)];
    const handler =
      !blockHandler && this.blocksDetail[block.label].category === 'interaction'
        ? this.engine.blocksHandler.interactionBlock
        : blockHandler;

    if (!handler) {
      console.error(`${block.label} doesn't have handler`);
      this.engine.destroy('stopped');
      return;
    }

    const { prevBlockData } = execParam;
    const refData = {
      prevBlockData,
      ...this.engine.referenceData,
      activeTabUrl: this.activeTab.url,
    };

    const replacedBlock = await templating({
      block,
      data: refData,
      isPopup: this.engine.isPopup,
      refKeys:
        isRetry || block.data.disableBlock
          ? null
          : this.blocksDetail[block.label].refDataKeys,
    });
    const blockDelay = this.settings?.blockDelay || 0;
    const addBlockLog = (status, obj = {}) => {
      let { description } = block.data;

      if (block.label === 'loop-breakpoint') description = block.data.loopId;
      else if (block.label === 'block-package') description = block.data.name;

      this.engine.addLogHistory({
        description,
        prevBlockData,
        type: status,
        name: block.label,
        blockId: block.id,
        workerId: this.id,
        timestamp: startExecuteTime,
        activeTabUrl: this.activeTab?.url,
        replacedValue: replacedBlock.replacedValue,
        duration: Math.round(Date.now() - startExecuteTime),
        ...obj,
      });
    };

    const executeBlocks = (blocks, data) => {
      return this.executeNextBlocks(
        blocks,
        data,
        execParam.nextBlockBreakpointCount
      );
    };

    try {
      let result;

      if (block.data.disableBlock) {
        result = {
          data: '',
          nextBlockId: this.getBlockConnections(block.id),
        };
      } else {
        const bindedHandler = handler.bind(this, replacedBlock, {
          refData,
          prevBlock,
          ...(execParam || {}),
        });
        result = await blockExecutionWrapper(bindedHandler, block.data);

        if (this.engine.isDestroyed) return;

        if (result.replacedValue) {
          replacedBlock.replacedValue = result.replacedValue;
        }

        addBlockLog(result.status || 'success', {
          logId: result.logId,
          ctxData: result?.ctxData,
        });
      }

      if (result.nextBlockId && !result.destroyWorker) {
        if (blockDelay > 0) {
          setTimeout(() => {
            executeBlocks(result.nextBlockId, result.data);
          }, blockDelay);
        } else {
          executeBlocks(result.nextBlockId, result.data);
        }
      } else {
        this.engine.destroyWorker(this.id);
      }
    } catch (error) {
      console.error(error);

      const errorLogData = {
        message: error.message,
        ...(error.data || {}),
        ...(error.ctxData || {}),
      };

      const { onError: blockOnError } = replacedBlock.data;
      if (blockOnError && blockOnError.enable) {
        if (blockOnError.retry && blockOnError.retryTimes) {
          await sleep(blockOnError.retryInterval * 1000);
          blockOnError.retryTimes -= 1;
          await this.executeBlock(replacedBlock, execParam, true);

          return;
        }

        if (blockOnError.insertData) {
          for (const item of blockOnError.dataToInsert) {
            let value = (
              await renderString(item.value, refData, this.engine.isPopup)
            )?.value;
            value = parseJSON(value, value);

            if (item.type === 'variable') {
              this.setVariable(item.name, value);
            } else {
              this.addDataToColumn(item.name, value);
            }
          }
        }

        const nextBlocks = this.getBlockConnections(
          block.id,
          blockOnError.toDo === 'continue' ? 1 : 'fallback'
        );
        if (blockOnError.toDo !== 'error' && nextBlocks) {
          addBlockLog('error', errorLogData);

          executeBlocks(nextBlocks, prevBlockData);

          return;
        }
      }

      const errorLogItem = errorLogData;
      addBlockLog('error', errorLogItem);

      errorLogItem.blockId = block.id;

      const { onError } = this.settings;
      const nodeConnections = this.getBlockConnections(block.id);

      if (onError === 'keep-running' && nodeConnections) {
        setTimeout(() => {
          executeBlocks(nodeConnections, error.data || '');
        }, blockDelay);
      } else if (onError === 'restart-workflow' && !this.parentWorkflow) {
        const restartCount = this.engine.restartWorkersCount[this.id] || 0;
        const maxRestart = this.settings.restartTimes ?? 3;

        if (restartCount >= maxRestart) {
          delete this.engine.restartWorkersCount[this.id];
          this.engine.destroy('error', error.message, errorLogItem);
          return;
        }

        this.reset();

        const triggerBlock = this.engine.blocks[this.engine.triggerBlockId];
        if (triggerBlock) this.executeBlock(triggerBlock, execParam);

        this.engine.restartWorkersCount[this.id] = restartCount + 1;
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

export default WorkflowWorker;

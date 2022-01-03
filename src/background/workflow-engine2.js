/* eslint-disable */
import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';
import { tasks } from '@/utils/shared';
import { convertData } from './workflow-engine/helper';
import { toCamelCase, parseJSON, isObject, objectHasKey } from '@/utils/helper';
import referenceData from '@/utils/reference-data';

/*
parentWorkflow {
  logId: string,
  state: object,
}
*/
export function getBlockConnection({ outputs }, index = 1) {
  const blockId = outputs[`output_${index}`]?.connections[0]?.node;

  return blockId;
}

class WorkflowEngine {
  constructor(workflow, { states, logger, blocksHandler, tabId, parentWorkflow, globalData }) {
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
    this.currentBlock = null;

    this.isDestroyed = false;
    this.isUsingProxy = false;

    this.blocks = {};
    this.history = [];
    this.eventListeners = {};
    this.columns = { column: { index: 0, type: 'any' } };

    const globalDataValue = globalData || workflow.globalData;

    this.activeTab = {
      url: '',
      id: tabId,
      frameId: 0,
      frames: {},
      groupId: null,
    }
    this.referenceData = {
      loopData: {},
      dataColumns: [],
      googleSheets: {},
      globalData: parseJSON(globalDataValue, globalDataValue),
    };
  }

  init() {
    if (this.workflow.isDisabled) return;

    const { drawflow } = this.workflow;
    const flow = typeof drawflow === 'string' ? parseJSON(drawflow, {}) : drawflow;
    const blocks = flow?.drawflow?.Home.data;

    if (!blocks) {
      console.error(`${this.workflow.name} doesn't have blocks`);
      return;
    }

    const triggerBlock = Object.values(blocks).find(({ name }) => name === 'trigger');
    if (!triggerBlock) {
      console.error(`${this.workflow.name} doesn't have a trigger block`);
      return;
    }

    const dataColumns = Array.isArray(this.workflow.dataColumns)
      ? this.workflow.dataColumns
      : Object.values(this.workflow.dataColumns);

    dataColumns.forEach(({ name, type }) => {
      this.columns[name] = { index: 0, type };
    });

    this.blocks = blocks;
    this.currentBlock = triggerBlock;
    this.startedTimestamp = Date.now();
    this.workflow.dataColumns = dataColumns;

    this.states.add(this.id, {
      state: this.state,
      workflowId: this.workflow.id,
      parentWorkflow: this.parentWorkflow,
    }).then(() => {
      this.executeBlock(triggerBlock);
    });
  }

  addLogHistory(detail) {
    if (
      !this.saveLog &&
      (this.history.length >= 1001 || detail.name === 'blocks-group') &&
      detail.type !== 'error'
    )
      return;

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

    const columnName = objectHasKey(this.columns, key) ? key : 'column';
    const currentColumn = this.columns[columnName];
    const convertedValue = convertData(value, currentColumn.type);

    if (objectHasKey(this.referenceData.dataColumns, currentColumn.index)) {
      this.referenceData.dataColumns[currentColumn.index][columnName] = convertedValue;
    } else {
      this.referenceData.dataColumns.push({ [columnName]: convertedValue });
    }

    currentColumn.index += 1;
  }

  async stop() {
    try {
      if (this.childWorkflowId) {
        await this.states.update(this.childWorkflowId, { isDestroyed: true });
      }

      await this.destroy('stopped');
    } catch (error) {
      console.error(error);
    }
  }

  async destroy(status, message) {
    try {
      if (this.isUsingProxy) chrome.proxy.settings.clear({});

      const endedTimestamp = Date.now();

      if (!this.workflow.isTesting && this.saveLog) {
        const { name, id } = this.workflow;

        await this.logger.add({
          name,
          status,
          message,
          id: this.id,
          workflowId: id,
          history: this.history,
          endedAt: endedTimestamp,
          parentLog: this.parentWorkflow,
          startedAt: this.startedTimestamp,
          data: this.referenceData.dataColumns,
        });
      }

      await this.states.delete(this.id);

      this.isDestroyed = true;
    } catch (error) {
      console.error(error);
    }
  }

  async executeBlock(block, prevBlockData) {
    const currentState = await this.states.get(this.id);
    console.log(currentState);
    if (!currentState || currentState.isDestroyed) {
      if (this.isDestroyed) return;

      await this.destroy('stopped');
      return;
    }

    this.currentBlock = block;

    await this.states.update(this.id, { state: this.state });
    console.log(block, prevBlockData);
    const startExecutedTime = Date.now();
    const blockHandler = this.blocksHandler[toCamelCase(block?.name)];
    const handler = !blockHandler && tasks[block.name].category === 'interaction'
      ? this.blocksHandler.interactionBlock
      : blockHandler;

    if (!handler) {
      console.error(`"${block.name}" block doesn't have a handler`);
      this.destroy('stopped');
      return;
    }

    const replacedBlock = referenceData({ block, data: this.referenceData });
    const blockDelay = this.workflow.settings?.blockDelay || 0;

    try {
      const result = await handler.call(this, replacedBlock, { prevBlockData, refData: this.referenceData });

      this.addLogHistory({
        type: 'success',
        name: block.name,
        logId: result.logId,
        duration: Math.round(Date.now() - startExecutedTime),
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
      this.addLogHistory({
        type: 'error',
        message: error.message,
        name: block.name,
        ...(error.data || {}),
      });

      if (
        this.workflow.settings.onError === 'keep-running' &&
        error.nextBlockId
      ) {
        setTimeout(() => {
          this.executeBlock(
            this.blocks[error.nextBlockId],
            error.data || ''
          );
        }, blockDelay);
      } else {
        this.destroy('error', error.message);
      }

      console.error(block.name, error);
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
      'activeTab',
      'isUsingProxy',
      'currentBlock',
      'referenceData',
      'startedTimestamp',
    ];
    const state = {};

    keys.forEach((key) => {
      state[key] = this[key];
    });

    return state;
  }

  _sendMessageToTab(payload, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.activeTab.id) {
        const error = new Error('no-tab');
        error.workflowId = this.id;

        reject(error);
        return;
      }

      browser.tabs
        .sendMessage(this.activeTab.id, { isBlock: true, ...payload }, options)
        .then(resolve)
        .catch(reject);
    });
  }
}

export default WorkflowEngine;

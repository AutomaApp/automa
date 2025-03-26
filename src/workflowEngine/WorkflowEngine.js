import dbStorage from '@/db/storage';
import BrowserAPIService from '@/service/browser-api/BrowserAPIService';
import { fetchApi } from '@/utils/api';
import { getBlocks } from '@/utils/getSharedData';
import { clearCache, isObject, parseJSON, sleep } from '@/utils/helper';
import cloneDeep from 'lodash.clonedeep';
import { nanoid } from 'nanoid';
import WorkflowWorker from './WorkflowWorker';

let blocks = getBlocks();

class WorkflowEngine {
  constructor(workflow, { states, logger, blocksHandler, isPopup, options }) {
    this.id = nanoid();
    this.states = states;
    this.logger = logger;
    this.workflow = workflow;
    this.isPopup = isPopup ?? true;
    // this.isMV2 = IS_MV2;
    this.blocksHandler = blocksHandler;
    this.isTestingMode = workflow.testingMode;
    this.parentWorkflow = options?.parentWorkflow;
    this.saveLog = workflow.settings?.saveLog ?? true;

    this.workerId = 0;
    this.workers = new Map();

    this.packagesCache = {};
    this.extractedGroup = {};
    this.connectionsMap = {};
    this.waitConnections = {};

    this.isDestroyed = false;
    this.isUsingProxy = false;
    this.isInBreakpoint = false;

    this.triggerBlockId = null;

    this.blocks = {};
    this.history = [];
    this.columnsId = {};
    this.historyCtxData = {};
    this.eventListeners = {};
    this.preloadScripts = [];

    this.columns = {
      column: {
        index: 0,
        type: 'any',
        name: this.workflow.settings?.defaultColumnName || 'column',
      },
    };
    this.rowData = {};

    this.logsLimit = 1001;
    this.logHistoryId = 0;

    let variables = {};
    let { globalData } = workflow;
    if (options && options?.data) {
      globalData = options.data.globalData || globalData;
      variables = isObject(options.data.variables)
        ? options?.data.variables
        : {};

      options.data = { globalData, variables };
    }
    this.options = options;

    this.refDataSnapshots = {};
    this.refDataSnapshotsKeys = {
      loopData: {
        index: 0,
        key: '##loopData0',
      },
      variables: {
        index: 0,
        key: '##variables0',
      },
    };
    this.referenceData = {
      variables,
      table: [],
      secrets: {},
      loopData: {},
      workflow: {},
      googleSheets: {},
      globalData: parseJSON(globalData, globalData),
    };

    this.onDebugEvent = ({ tabId }, method, params) => {
      let isActiveTabEvent = false;
      this.workers.forEach((worker) => {
        if (isActiveTabEvent) return;

        isActiveTabEvent = worker.activeTab.id === tabId;
      });

      if (!isActiveTabEvent) return;

      (this.eventListeners[method] || []).forEach((listener) => {
        listener(params);
      });
    };
    this.onWorkflowStopped = (id) => {
      if (this.id !== id || this.isDestroyed) return;
      this.stop();
    };
    this.onResumeExecution = ({ id, nextBlock }) => {
      if (this.id !== id || this.isDestroyed) return;

      this.workers.forEach((worker) => {
        worker.resume(nextBlock);
      });
    };

    // this.messageListener = new MessageListener('workflow-engine');
  }

  async init() {
    try {
      if (this.workflow.isDisabled) return;

      if (!this.states) {
        console.error(`"${this.workflow.name}" workflow doesn't have states`);
        this.destroy('error');
        return;
      }

      console.log('before execute', this.state, '\n', this.workflow);

      const { nodes, edges } = this.workflow.drawflow;
      if (!nodes || nodes.length === 0) {
        console.error(`${this.workflow.name} doesn't have blocks`);
        return;
      }

      const triggerBlock = nodes.find((node) => {
        if (this.options?.blockId) return node.id === this.options.blockId;

        return node.label === 'trigger';
      });
      if (!triggerBlock) {
        console.error(`${this.workflow.name} doesn't have a trigger block`);
        return;
      }

      if (!this.workflow.settings) {
        this.workflow.settings = {};
      }

      blocks = getBlocks();

      const checkParams = this.options?.checkParams ?? true;
      const hasParams =
        checkParams && triggerBlock.data?.parameters?.length > 0;
      if (hasParams) {
        this.eventListeners = {};

        if (triggerBlock.data.preferParamsInTab) {
          const [activeTab] = await BrowserAPIService.tabs.query({
            active: true,
            url: '*://*/*',
            lastFocusedWindow: true,
          });
          if (activeTab) {
            const result = await BrowserAPIService.tabs.sendMessage(
              activeTab.id,
              {
                type: 'input-workflow-params',
                data: {
                  workflow: this.workflow,
                  params: triggerBlock.data.parameters,
                },
              }
            );

            if (result) return;
          }
        }

        const paramUrl = BrowserAPIService.runtime.getURL('params.html');
        const tabs = await BrowserAPIService.tabs.query({});
        const paramTab = tabs.find((tab) => tab.url?.includes(paramUrl));

        if (paramTab) {
          await BrowserAPIService.tabs.sendMessage(paramTab.id, {
            name: 'workflow:params',
            data: this.workflow,
          });
          await BrowserAPIService.windows.update(paramTab.windowId, {
            focused: true,
          });
        } else {
          BrowserAPIService.windows.create({
            type: 'popup',
            width: 480,
            height: 700,
            url: BrowserAPIService.runtime.getURL(
              `/params.html?workflowId=${this.workflow.id}`
            ),
          });
        }
        return;
      }

      this.triggerBlockId = triggerBlock.id;

      this.blocks = nodes.reduce((acc, node) => {
        acc[node.id] = node;

        return acc;
      }, {});
      this.connectionsMap = edges.reduce(
        (acc, { sourceHandle, target, targetHandle }) => {
          if (!acc[sourceHandle]) acc[sourceHandle] = new Map();
          acc[sourceHandle].set(target, {
            id: target,
            targetHandle,
            sourceHandle,
          });

          return acc;
        },
        {}
      );

      const workflowTable =
        this.workflow.table || this.workflow.dataColumns || [];
      let columns = Array.isArray(workflowTable)
        ? workflowTable
        : Object.values(workflowTable);

      if (this.workflow.connectedTable) {
        const connectedTable = await dbStorage.tablesItems
          .where('id')
          .equals(this.workflow.connectedTable)
          .first();
        const connectedTableData = await dbStorage.tablesData
          .where('tableId')
          .equals(connectedTable?.id)
          .first();
        if (connectedTable && connectedTableData) {
          columns = Object.values(connectedTable.columns);
          Object.assign(this.columns, connectedTableData.columnsIndex);
          this.referenceData.table = connectedTableData.items || [];
        } else {
          this.workflow.connectedTable = null;
        }
      }

      columns.forEach(({ name, type, id }) => {
        const columnId = id || name;

        this.rowData[name] = null;

        this.columnsId[name] = columnId;
        if (!this.columns[columnId])
          this.columns[columnId] = { index: 0, name, type };
      });

      if (BROWSER_TYPE !== 'chrome') {
        this.workflow.settings.debugMode = false;
      } else if (this.workflow.settings.debugMode) {
        BrowserAPIService.debugger.onEvent.addListener(this.onDebugEvent);
      }
      if (
        this.workflow.settings.reuseLastState &&
        !this.workflow.connectedTable
      ) {
        const lastStateKey = `state:${this.workflow.id}`;
        const value = await BrowserAPIService.storage.local.get(lastStateKey);
        const lastState = value[lastStateKey];

        if (lastState) {
          Object.assign(this.columns, lastState.columns);
          Object.assign(this.referenceData, lastState.referenceData);
        }
      }

      const { settings: userSettings = {} } =
        (await BrowserAPIService.storage.local.get('settings')) || {};
      this.logsLimit = userSettings?.logsLimit || 1001;

      this.workflow.table = columns;
      this.startedTimestamp = Date.now();

      this.states.on('stop', this.onWorkflowStopped);
      this.states.on('resume', this.onResumeExecution);

      const credentials = await dbStorage.credentials.toArray();
      credentials.forEach(({ name, value }) => {
        this.referenceData.secrets[name] = value;
      });

      const variables = await dbStorage.variables.toArray();
      variables.forEach(({ name, value }) => {
        this.referenceData.variables[`$$${name}`] = value;
      });

      this.addRefDataSnapshot('variables');

      await this.states.add(this.id, {
        id: this.id,
        status: 'running',
        state: this.state,
        workflowId: this.workflow.id,
        parentState: this.parentWorkflow,
        teamId: this.workflow.teamId || null,
      });
      this.addWorker({ blockId: triggerBlock.id });
    } catch (error) {
      console.error('WorkflowEngine init error:', error);
    }
  }

  addRefDataSnapshot(key) {
    this.refDataSnapshotsKeys[key].index += 1;
    this.refDataSnapshotsKeys[key].key = key;

    const keyName = this.refDataSnapshotsKeys[key].key;
    this.refDataSnapshots[keyName] = cloneDeep(this.referenceData[key]);
  }

  addWorker(detail) {
    this.workerId += 1;

    const workerId = `worker-${this.workerId}`;
    const worker = new WorkflowWorker(workerId, this, { blocksDetail: blocks });
    worker.init(detail);

    this.workers.set(worker.id, worker);
  }

  addLogHistory(detail) {
    if (detail.name === 'blocks-group') return;

    const isLimit = this.history?.length >= this.logsLimit;
    const notErrorLog = detail.type !== 'error';

    if ((isLimit || !this.saveLog) && notErrorLog) return;

    this.logHistoryId += 1;
    detail.id = this.logHistoryId;

    if (
      detail.name !== 'delay' ||
      detail.replacedValue ||
      detail.name === 'javascript-code' ||
      (blocks[detail.name]?.refDataKeys && this.saveLog)
    ) {
      const { variables, loopData } = this.refDataSnapshotsKeys;

      this.historyCtxData[this.logHistoryId] = {
        referenceData: {
          loopData: loopData.key,
          variables: variables.key,
          activeTabUrl: detail.activeTabUrl,
          prevBlockData: detail.prevBlockData || '',
        },
        replacedValue: cloneDeep(detail.replacedValue),
        ...(detail?.ctxData || {}),
      };

      delete detail.replacedValue;
    }

    this.history.push(detail);
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
    const { workflowQueue } = (await BrowserAPIService.storage.local.get(
      'workflowQueue'
    )) || { workflowQueue: [] };
    const queueIndex = (workflowQueue || []).indexOf(this.workflow?.id);

    if (!workflowQueue || queueIndex === -1) return;

    const engine = new WorkflowEngine(this.workflow, {
      logger: this.logger,
      states: this.states,
      blocksHandler: this.blocksHandler,
    });
    engine.init();

    workflowQueue.splice(queueIndex, 1);

    await BrowserAPIService.storage.localSet({ workflowQueue });
  }

  async destroyWorker(workerId) {
    // is last worker
    if (this.workers.size === 1 && this.workers.has(workerId)) {
      this.addLogHistory({
        type: 'finish',
        name: 'finish',
      });
      this.dispatchEvent('finish');
      await this.destroy('success');
    }
    // wait detach debugger
    this.workers.delete(workerId);

    // No active workers, destroying workflow
    if (this.workers.size === 0) {
      this.destroy('success');
    }
  }

  async destroy(status, message, blockDetail) {
    const cleanUp = () => {
      this.id = null;
      this.states = null;
      this.logger = null;
      this.saveLog = null;
      this.workflow = null;
      this.blocksHandler = null;
      this.parentWorkflow = null;

      this.isDestroyed = true;
      this.referenceData = null;
      this.eventListeners = null;
      this.packagesCache = null;
      this.extractedGroup = null;
      this.connectionsMap = null;
      this.waitConnections = null;
      this.blocks = null;
      this.history = null;
      this.columnsId = null;
      this.historyCtxData = null;
      this.preloadScripts = null;
    };

    try {
      if (this.isDestroyed) return;
      if (this.isUsingProxy) BrowserAPIService.proxy.clearSettings({});
      if (this.workflow.settings.debugMode && BROWSER_TYPE === 'chrome') {
        BrowserAPIService.debugger.onEvent.removeListener(this.onDebugEvent);

        await sleep(1000);

        this.workers.forEach((worker) => {
          if (!worker.debugAttached) return;

          BrowserAPIService.debugger.detach({ tabId: worker.activeTab.id });
        });
      }

      const endedTimestamp = Date.now();
      this.workers.clear();
      this.executeQueue();

      this.states.off('stop', this.onWorkflowStopped);
      await this.states.delete(this.id);

      if (!this.workflow.settings?.debugMode) {
        const { user } = (await BrowserAPIService.storage.local.get(
          'user'
        )) || { user: null };

        const logDto = {
          workflowId: this.workflow.id,
          workflowName: this.workflow.name,
          nodesCount: this.workflow.drawflow.nodes.length,
          status,
          message: message || '',
          startedAt: new Date(this.startedTimestamp).toISOString(),
          endedAt: new Date(endedTimestamp).toISOString(),
          userId: user?.id,
        };

        try {
          const response = await fetchApi('/workflows/logs/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logDto),
            auth: true,
          });

          if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
          }
        } catch (err) {
          console.error('Failed to report workflow execution:', err);
        }
      }

      this.dispatchEvent('destroyed', {
        status,
        message,
        blockDetail,
        id: this.id,
        endedTimestamp,
        history: this.history,
        startedTimestamp: this.startedTimestamp,
      });

      if (this.workflow.settings.reuseLastState) {
        const workflowState = {
          [`state:${this.workflow.id}`]: {
            columns: this.columns,
            referenceData: {
              table: this.referenceData.table,
              variables: this.referenceData.variables,
            },
          },
        };

        BrowserAPIService.storage.localSet(workflowState);
      } else if (status === 'success') {
        clearCache(this.workflow);
      }

      const { table, variables } = this.referenceData;
      const tableId = this.workflow.connectedTable;

      // Merge all table and variables from all workflows
      Object.values(this.referenceData.workflow).forEach((data) => {
        Object.assign(table, data.table);
        Object.assign(variables, data.variables);
      });

      await dbStorage.transaction(
        'rw',
        dbStorage.tablesItems,
        dbStorage.tablesData,
        async () => {
          if (!tableId) return;

          await dbStorage.tablesItems.update(tableId, {
            modifiedAt: Date.now(),
            rowsCount: table.length,
          });
          await dbStorage.tablesData.where('tableId').equals(tableId).modify({
            items: table,
            columnsIndex: this.columns,
          });
        }
      );

      if (!this.workflow?.isTesting) {
        const { name, id, teamId } = this.workflow;

        await this.logger.add({
          detail: {
            name,
            status,
            teamId,
            message,
            id: this.id,
            workflowId: id,
            saveLog: this.saveLog,
            endedAt: endedTimestamp,
            parentLog: this.parentWorkflow,
            startedAt: this.startedTimestamp,
          },
          history: {
            logId: this.id,
            data: this.saveLog ? this.history : [],
          },
          ctxData: {
            logId: this.id,
            data: {
              ctxData: this.historyCtxData,
              dataSnapshot: this.refDataSnapshots,
            },
          },
          data: {
            logId: this.id,
            data: {
              table: [...this.referenceData.table],
              variables: { ...this.referenceData.variables },
            },
          },
        });
      }

      cleanUp();
    } catch (error) {
      console.error('workflowEngine error', error);
      cleanUp();
    }
  }

  async updateState(data) {
    const state = {
      ...data,
      tabIds: [],
      currentBlock: [],
      name: this.workflow.name,
      logs: this.history,
      ctxData: {
        ctxData: this.historyCtxData,
        dataSnapshot: this.refDataSnapshots,
      },
      startedTimestamp: this.startedTimestamp,
    };

    this.workers.forEach((worker) => {
      const { id, label, startedAt } = worker.currentBlock;

      state.currentBlock.push({ id, name: label, startedAt });
      state.tabIds.push(worker.activeTab.id);
    });

    await this.states.update(this.id, { state });
    this.dispatchEvent('update', { state });
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
}

export default WorkflowEngine;

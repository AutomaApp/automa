import { defineStore } from 'pinia';
import { nanoid } from 'nanoid';
import defu from 'defu';
import deepmerge from 'lodash.merge';
import browser from 'webextension-polyfill';
import dayjs from 'dayjs';
import { fetchApi } from '@/utils/api';
import { tasks } from '@/utils/shared';
import firstWorkflows from '@/utils/firstWorkflows';
import { cleanWorkflowTriggers } from '@/utils/workflowTrigger';
import { parseJSON } from '@/utils/helper';
import { useUserStore } from './user';

const defaultWorkflow = (data = null) => {
  let workflowData = {
    id: nanoid(),
    name: '',
    icon: 'riGlobalLine',
    folderId: null,
    connectedTable: null,
    drawflow: {
      edges: [],
      position: { zoom: 1 },
      nodes: [
        {
          position: {
            x: 100,
            y: window.innerHeight / 2,
          },
          id: nanoid(),
          label: 'trigger',
          data: tasks.trigger.data,
          type: tasks.trigger.component,
        },
      ],
    },
    table: [],
    dataColumns: [],
    description: '',
    trigger: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDisabled: false,
    settings: {
      publicId: '',
      blockDelay: 0,
      saveLog: true,
      debugMode: false,
      restartTimes: 3,
      notification: true,
      reuseLastState: false,
      inputAutocomplete: true,
      onError: 'stop-workflow',
      executedBlockOnWeb: false,
      insertDefaultColumn: true,
      defaultColumnName: 'column',
    },
    version: browser.runtime.getManifest().version,
    globalData: '{\n\t"key": "value"\n}',
  };

  if (data) {
    if (data.drawflow?.nodes?.length > 0) {
      workflowData.drawflow.nodes = [];
    }

    workflowData = defu(data, workflowData);
  }

  return workflowData;
};

function convertWorkflowsToObject(workflows) {
  if (Array.isArray(workflows)) {
    return workflows.reduce((acc, workflow) => {
      acc[workflow.id] = workflow;

      return acc;
    }, {});
  }

  return workflows;
}

export const useWorkflowStore = defineStore('workflow', {
  storageMap: {
    workflows: 'workflows',
  },
  state: () => ({
    states: [],
    workflows: {},
    retrieved: false,
  }),
  getters: {
    getById: (state) => (id) => state.workflows[id],
    getWorkflows: (state) => Object.values(state.workflows),
    getWorkflowStates: (state) => (id) =>
      state.states.filter(({ workflowId }) => workflowId === id),
  },
  actions: {
    async loadData() {
      const { workflows, isFirstTime } = await browser.storage.local.get([
        'workflows',
        'isFirstTime',
      ]);

      let localWorkflows = workflows;

      if (isFirstTime) {
        localWorkflows = firstWorkflows.map((workflow) =>
          defaultWorkflow(workflow)
        );
        await browser.storage.local.set({ isFirstTime: false });
      }

      this.workflows = convertWorkflowsToObject(localWorkflows);

      const storedStates = localStorage.getItem('workflowState') || '{}';
      const states = parseJSON(storedStates, {});
      this.states = Object.values(states).filter(
        ({ isDestroyed }) => !isDestroyed
      );

      this.retrieved = true;
    },
    async insert(data = {}) {
      const insertedWorkflows = {};

      if (Array.isArray(data)) {
        data.forEach((item) => {
          delete item.id;

          const workflow = defaultWorkflow(item);
          this.workflows[workflow.id] = workflow;
          insertedWorkflows[workflow.id] = workflow;
        });
      } else {
        delete data.id;

        const workflow = defaultWorkflow(data);
        this.workflows[workflow.id] = workflow;
        insertedWorkflows[workflow.id] = workflow;
      }

      await this.saveToStorage('workflows');

      return insertedWorkflows;
    },
    async update({ id, data = {}, deep = false }) {
      const isFunction = typeof id === 'function';
      if (!isFunction && !this.workflows[id]) return null;

      const updatedWorkflows = {};
      const workflowUpdater = (workflowId) => {
        if (deep) {
          this.workflows[workflowId] = deepmerge(
            this.workflows[workflowId],
            data
          );
        } else {
          Object.assign(this.workflows[workflowId], data);
        }

        this.workflows[workflowId].updatedAt = Date.now();
        updatedWorkflows[workflowId] = this.workflows[workflowId];
      };

      if (isFunction) {
        this.getWorkflows.forEach((workflow) => {
          const isMatch = id(workflow) ?? false;
          if (isMatch) workflowUpdater(workflow.id);
        });
      } else {
        workflowUpdater(id);
      }

      await this.saveToStorage('workflows');

      return updatedWorkflows;
    },
    async insertOrUpdate(data = [], { checkUpdateDate = false } = {}) {
      const insertedData = {};

      data.forEach((item) => {
        const currentWorkflow = this.workflows[item.id];
        if (currentWorkflow) {
          let insert = true;
          if (checkUpdateDate && currentWorkflow.createdAt && item.updatedAt) {
            insert = dayjs(currentWorkflow.updatedAt).isBefore(item.updatedAt);
          }

          if (insert) {
            Object.assign(this.workflows[item.id], item);
            insertedData[item.id] = this.workflows[item.id];
          }
        } else {
          const workflow = defaultWorkflow(item);
          this.workflows[workflow.id] = workflow;
          insertedData[workflow.id] = workflow;
        }
      });

      await this.saveToStorage('workflows');

      return insertedData;
    },
    async delete(id) {
      if (Array.isArray(id)) {
        id.forEach((workflowId) => {
          delete this.workflows[workflowId];
        });
      } else {
        delete this.workflows[id];
      }

      await cleanWorkflowTriggers(id);

      const userStore = useUserStore();

      const hostedWorkflow = userStore.hostedWorkflows[id];
      const backupIndex = userStore.backupIds.indexOf(id);

      if (hostedWorkflow || backupIndex !== -1) {
        const response = await fetchApi(`/me/workflows?id=${id}`, {
          method: 'DELETE',
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message);
        }

        if (backupIndex !== -1) {
          userStore.backupIds.splice(backupIndex, 1);
          await browser.storage.local.set({ backupIds: userStore.backupIds });
        }
      }

      await browser.storage.local.remove(`state:${id}`);

      await this.saveToStorage('workflows');

      return id;
    },
  },
});

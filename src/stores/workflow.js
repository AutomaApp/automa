import { defineStore } from 'pinia';
import { nanoid } from 'nanoid';
import defu from 'defu';
import deepmerge from 'lodash.merge';
import browser from 'webextension-polyfill';
import { fetchApi } from '@/utils/api';
import { firstWorkflows } from '@/utils/shared';
import { registerWorkflowTrigger } from '@/utils/workflowTrigger';
import { parseJSON, objectHasKey, findTriggerBlock } from '@/utils/helper';

function getWorkflowKey(state, id, location = 'local') {
  let key = id;

  if (Array.isArray(state[location])) {
    const index = state[location].findIndex((workflow) => workflow.id === id);
    key = index === -1 ? null : index;
  } else {
    key = objectHasKey(state[location]) ? key : null;
  }

  return key;
}

export const useWorkflowStore = defineStore('workflow', {
  storageMap: {
    local: 'workflows',
    hosted: 'workflowHosts',
    userHosted: 'hostWorkflow',
  },
  state: () => ({
    local: [],
    states: [],
    shared: {},
    hosted: {},
    userHosted: {},
    retrieved: false,
  }),
  getters: {
    getById: (state) => (location, id) => {
      let data = state[location];

      if (!Array.isArray(data)) data = Object.values(data);

      return data.find((item) => item.id === id);
    },
  },
  actions: {
    loadLocal() {
      return browser.storage.local
        .get(['workflows', 'workflowHosts', 'isFirstTime'])
        .then(({ workflows, workflowHosts, isFirstTime }) => {
          this.hosted = workflowHosts || {};
          this.local = isFirstTime ? firstWorkflows : workflows;

          if (isFirstTime) {
            browser.storage.local.set({
              isFirstTime: false,
            });
          }
        });
    },
    loadStates() {
      const storedStates = localStorage.getItem('workflowState') || '{}';
      const states = parseJSON(storedStates, {});

      this.states = Object.values(states).filter(
        ({ isDestroyed }) => !isDestroyed
      );
    },
    addWorkflow(data = {}) {
      const workflow = defu(data, {
        id: nanoid(),
        name: '',
        icon: 'riGlobalLine',
        folderId: null,
        drawflow: { edges: [], nodes: [] },
        table: [],
        dataColumns: [],
        description: '',
        trigger: null,
        version: '',
        createdAt: Date.now(),
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
        globalData: '{\n\t"key": "value"\n}',
      });

      this.local.push(workflow);
    },
    workflowExist(id, location = 'local') {
      let key = id;

      if (Array.isArray(this[location])) {
        const index = this.local.findIndex((workflow) => workflow.id === id);
        key = index === -1 ? null : index;
      } else {
        key = objectHasKey(this[location]) ? key : null;
      }

      return Boolean(key);
    },
    async updateWorkflow({ id, location = 'local', data = {}, deep = false }) {
      const key = getWorkflowKey(this, id, location);
      if (key === null) return null;

      if (deep) {
        deepmerge(this[location][key], data);
      } else {
        Object.assign(this[location][key], data);
      }

      if (this.retrieved) {
        await this.saveToStorage(location);
      }

      return this[location][key];
    },
    deleteWorkflow(id, location = 'local') {
      const key = getWorkflowKey(this, id, location);
      if (key === null) return null;

      if (Array.isArray(this[location])) {
        this[location].splice(key, 1);
      } else {
        delete this[location];
      }

      return id;
    },
    async syncHostedWorkflows() {
      const ids = [];
      const userHosted = Object.values(this.userHosted);

      Object.keys(this.hosted).forEach((hostId) => {
        const isItsOwn = userHosted.find((item) => item.hostId === hostId);

        if (isItsOwn) return;

        ids.push({ hostId, updatedAt: this.hosted[hostId].updatedAt });
      });

      const response = await fetchApi('/workflows/hosted', {
        method: 'POST',
        body: JSON.stringify({ hosts: ids }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message);

      result.forEach(({ hostId, status, data }) => {
        if (status === 'deleted') {
          delete this.hosted[hostId];
          return;
        }
        if (status === 'updated') {
          const triggerBlock = findTriggerBlock(data.drawflow);
          registerWorkflowTrigger(hostId, triggerBlock);
        }

        data.hostId = hostId;
        this.hosted[hostId] = data;
      });

      await browser.storage.local.set({
        workflowHosts: this.hosted,
      });

      return this.hosted;
    },
  },
});

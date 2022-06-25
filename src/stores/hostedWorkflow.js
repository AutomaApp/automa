import { defineStore } from 'pinia';
import browser from 'webextension-polyfill';
import { fetchApi } from '@/utils/api';
import { findTriggerBlock } from '@/utils/helper';
import {
  registerWorkflowTrigger,
  cleanWorkflowTriggers,
} from '@/utils/workflowTrigger';
import { useUserStore } from './user';

export const useHostedWorkflowStore = defineStore('hosted-workflows', {
  storageMap: {
    workflows: 'workflowHosts',
  },
  state: () => ({
    workflows: {},
    retrieved: false,
  }),
  getters: {
    getById: (state) => (id) => state.workflows[id],
    toArray: (state) => Object.values(state.workflows),
  },
  actions: {
    async loadData() {
      const { workflowHosts } = await browser.storage.local.get(
        'workflowHosts'
      );
      this.workflows = workflowHosts || {};
      this.retrieved = true;
    },
    async insert(data, idKey = 'hostId') {
      if (Array.isArray(data)) {
        data.forEach((item) => {
          this.workflows[item[idKey]] = item;
        });
      } else {
        this.workflows[data[idKey]] = data;
      }

      await this.saveToStorage('workflows');

      return data;
    },
    async delete(id) {
      delete this.workflows[id];

      await this.saveToStorage('workflows');
      await cleanWorkflowTriggers(id);

      return id;
    },
    async update({ id, data }) {
      if (!this.workflows[id]) return null;

      Object.assign(this.workflows[id], data);
      await this.saveToStorage('workflows');

      return this.workflows[id];
    },
    async addHostedWorkflow(hostId) {
      if (this.workflows[hostId]) throw new Error('exist');

      const userStore = useUserStore();
      if (!userStore.user && this.toArray.length >= 3)
        throw new Error('rate-exceeded');

      const isTheUserHost = userStore.getHostedWorkflows.some(
        (host) => hostId === host.hostId
      );
      if (isTheUserHost) throw new Error('exist');

      const response = await fetchApi('/workflows/hosted', {
        method: 'POST',
        body: JSON.stringify({ hostId }),
      });
      const result = await response.json();

      if (!response.ok) {
        const error = new Error(result.message);
        error.data = result.data;

        throw error;
      }

      if (result === null) throw new Error('not-found');

      result.hostId = hostId;
      result.createdAt = Date.now();

      const triggerBlock = findTriggerBlock(result.drawflow);
      await registerWorkflowTrigger(hostId, triggerBlock);

      this.workflows[hostId] = result;
      await this.saveToStorage('workflows');

      return result;
    },
    async fetchWorkflows(ids) {
      if (!ids || ids.length === 0) return null;

      const response = await fetchApi('/workflows/hosted', {
        method: 'POST',
        body: JSON.stringify({ hosts: ids }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message);

      const dataToReturn = [];

      result.forEach(({ hostId, status, data }) => {
        if (status === 'deleted') {
          delete this.workflows[hostId];
          return;
        }
        if (status === 'updated') {
          const triggerBlock = findTriggerBlock(data.drawflow);
          registerWorkflowTrigger(hostId, triggerBlock);
        }

        data.hostId = hostId;
        dataToReturn.push(data);
        this.workflows[hostId] = data;
      });

      await this.saveToStorage('workflows');

      return dataToReturn;
    },
  },
});

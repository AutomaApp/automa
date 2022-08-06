import { defineStore } from 'pinia';
import { fetchApi, cacheApi } from '@/utils/api';
import { useUserStore } from './user';

export const useSharedWorkflowStore = defineStore('shared-workflows', {
  state: () => ({
    workflows: {},
  }),
  getters: {
    toArray: (state) => Object.values(state.workflows),
    getById: (state) => (id) => {
      if (!state.workflows) return null;

      return state.workflows[id] || null;
    },
  },
  actions: {
    insert(data) {
      if (Array.isArray(data)) {
        data.forEach((item) => {
          this.workflows[item.id] = item;
        });
      } else {
        this.workflows[data.id] = data;
      }
    },
    update({ id, data }) {
      if (!this.workflows[id]) return null;

      Object.assign(this.workflows[id], data);

      return this.workflows[id];
    },
    delete(id) {
      delete this.workflows[id];
    },
    async fetchWorkflows(useCache = true) {
      const userStore = useUserStore();
      if (!userStore.user) return;

      const workflows = await cacheApi(
        'shared-workflows',
        async () => {
          try {
            const response = await fetchApi('/me/workflows/shared?data=all');

            if (response.status !== 200) throw new Error(response.statusText);

            const result = await response.json();
            const sharedWorkflows = result.reduce((acc, item) => {
              item.table = item.table || item.dataColumns || [];
              item.createdAt = new Date(item.createdAt || Date.now()).getTime();

              acc[item.id] = item;

              return acc;
            }, {});

            return sharedWorkflows;
          } catch (error) {
            console.error(error);
            return {};
          }
        },
        useCache
      );

      this.workflows = workflows || {};
    },
  },
});

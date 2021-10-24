import { createStore } from 'vuex';
import browser from 'webextension-polyfill';
import vuexORM from '@/lib/vuex-orm';
import * as models from '@/models';

const store = createStore({
  plugins: [vuexORM(models)],
  state: () => ({
    workflowState: [],
  }),
  mutations: {
    updateState(state, { key, value }) {
      state[key] = value;
    },
  },
  getters: {
    getWorkflowState: (state) => (id) =>
      state.workflowState.filter(({ workflowId }) => workflowId === id),
  },
  actions: {
    async retrieve({ dispatch, getters }, keys = 'workflows') {
      try {
        const data = await browser.storage.local.get(keys);
        const promises = Object.keys(data).map((entity) => {
          const entityData = getters[`entities/${entity}/all`]();

          if (entityData.length > 0) return entityData;

          return dispatch('entities/create', {
            entity,
            data: data[entity],
          });
        });

        return await Promise.allSettled(promises);
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    async retrieveWorkflowState({ commit }) {
      try {
        const { workflowState } = await browser.storage.local.get(
          'workflowState'
        );

        commit('updateState', { key: 'workflowState', value: workflowState });
      } catch (error) {
        console.error(error);
      }
    },
    saveToStorage({ getters }, key) {
      return new Promise((resolve, reject) => {
        if (!key) {
          reject(new Error('You need to pass the entity name'));
          return;
        }
        const data = getters[`entities/${key}/all`]();

        browser.storage.local.set({ [key]: data }).then(() => {
          resolve();
        });
      });
    },
  },
});

export default store;

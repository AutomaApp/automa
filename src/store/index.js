import { createStore } from 'vuex';
import browser from 'webextension-polyfill';
import vuexORM from '@/lib/vuex-orm';
import * as models from '@/models';
import { firstWorkflows } from '@/utils/shared';

const store = createStore({
  plugins: [vuexORM(models)],
  state: () => ({
    workflowState: [],
    settings: {
      locale: 'en',
    },
  }),
  mutations: {
    updateState(state, { key, value }) {
      state[key] = value;
    },
  },
  getters: {
    getWorkflowState: (state) => (id) =>
      (state.workflowState || []).filter(
        ({ workflowId, isInCollection }) => workflowId === id && !isInCollection
      ),
  },
  actions: {
    updateSettings({ state, commit }, data) {
      commit('updateState', {
        key: 'settings',
        value: {
          ...state.settings,
          ...data,
        },
      });

      browser.storage.local.set({ settings: state.settings });
    },
    async retrieve({ dispatch, getters, commit, state }, keys = 'workflows') {
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

        const { isFirstTime, settings } = await browser.storage.local.get([
          'isFirstTime',
          'settings',
        ]);

        commit('updateState', {
          key: 'settings',
          value: { ...state.settings, ...(settings || {}) },
        });

        if (isFirstTime) {
          await dispatch('entities/insert', {
            entity: 'workflows',
            data: firstWorkflows,
          });
          await browser.storage.local.set({
            isFirstTime: false,
          });
          await dispatch('saveToStorage', 'workflows');
        }

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

        commit('updateState', {
          key: 'workflowState',
          value: Object.values(workflowState || {}).filter(
            ({ isDestroyed }) => !isDestroyed
          ),
        });
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

        browser.storage.local
          .set({ [key]: JSON.parse(JSON.stringify(data)) })
          .then(() => {
            resolve();
          });
      });
    },
  },
});

export default store;

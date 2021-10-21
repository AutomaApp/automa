import { createStore } from 'vuex';
import browser from 'webextension-polyfill';
import vuexORM from '@/lib/vuex-orm';
import * as models from '@/models';

const store = createStore({
  plugins: [vuexORM(models)],
  actions: {
    async retrieve({ dispatch }, keys = 'workflows') {
      try {
        const data = await browser.storage.local.get(keys);
        const promises = Object.keys(data).map((entity) =>
          dispatch('entities/create', {
            entity,
            data: data[entity],
          })
        );

        await Promise.allSettled(promises);
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

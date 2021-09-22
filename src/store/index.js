import { createStore } from 'vuex';
import browser from 'webextension-polyfill';
import vuexORM from '@/lib/vuex-orm';
import * as models from '@/models';

const store = createStore({
  plugins: [vuexORM(models)],
  actions: {
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

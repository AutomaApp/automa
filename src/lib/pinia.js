import { markRaw, toRaw } from 'vue';
import { createPinia } from 'pinia';
import browser from 'webextension-polyfill';

function saveToStoragePlugin({ store, options }) {
  const newBrowser = markRaw(browser);

  store.saveToStorage = (key) => {
    const storageKey = options.storageMap[key];
    if (!storageKey || !store.retrieved) return null;

    return newBrowser.storage.local.set({ [storageKey]: toRaw(store[key]) });
  };
}

const pinia = createPinia();
pinia.use(saveToStoragePlugin);

export default pinia;

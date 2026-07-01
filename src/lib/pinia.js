import { createPinia } from 'pinia';
import browser from 'webextension-polyfill';

function saveToStoragePlugin({ store, options }) {
  store.saveToStorage = (key) => {
    const storageKey = options.storageMap[key];
    if (!storageKey || !store.retrieved) return null;

    const value = JSON.parse(JSON.stringify(store[key]));

    return browser.storage.local.set({ [storageKey]: value });
  };
}

const pinia = createPinia();
pinia.use(saveToStoragePlugin);

export default pinia;

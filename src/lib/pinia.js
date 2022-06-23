import { markRaw, toRaw } from 'vue';
import { createPinia } from 'pinia';
import browser from 'webextension-polyfill';

function saveToStoragePlugin({ store, options }) {
  const newBrowser = markRaw(browser);

  store.saveToStorage = (key) => {
    const storageKey = options.storageMap[key];
    if (!storageKey) return;

    newBrowser.storage.local.set({ [storageKey]: toRaw(store[key]) });
  };
  store.$subscribe(({ events }, state) => {
    if (!state.retrieved || !options.storageMap) return;

    const storageKey = options.storageMap[events.key];
    if (!storageKey) return;

    console.log(storageKey, events.newValue);
  });
}

const pinia = createPinia();
pinia.use(saveToStoragePlugin);

export default pinia;

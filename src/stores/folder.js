import { defineStore } from 'pinia';
import browser from 'webextension-polyfill';

export const useFolderStore = defineStore('folder', {
  state: () => ({
    items: [],
  }),
  actions: {
    load() {
      return browser.storage.local.get('folders').then(({ folders }) => {
        this.items = folders;

        return folders;
      });
    },
  },
});

import { defineStore } from 'pinia';
import { nanoid } from 'nanoid';
import browser from 'webextension-polyfill';

export const useFolderStore = defineStore('folder', {
  storageMap: {
    items: 'folders',
  },
  state: () => ({
    items: [],
    retrieved: false,
  }),
  actions: {
    async addFolder(name) {
      this.items.push({
        name,
        id: nanoid(),
      });

      await this.saveToStorage('items');

      return this.items.at(-1);
    },
    async deleteFolder(id) {
      const index = this.items.findIndex((folder) => folder.id === id);
      if (index === -1) return null;

      this.items.splice(index, 1);
      await this.saveToStorage('items');

      return index;
    },
    async updateFolder(id, data = {}) {
      const index = this.items.findIndex((folder) => folder.id === id);
      if (index === -1) return null;

      Object.assign(this.items[index], data);
      await this.saveToStorage('items');

      return this.items[index];
    },
    load() {
      return browser.storage.local.get('folders').then(({ folders }) => {
        this.items = folders || [];
        this.retrieved = true;
        return folders;
      });
    },
  },
});

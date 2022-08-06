import { defineStore } from 'pinia';
import defu from 'defu';
import browser from 'webextension-polyfill';
import deepmerge from 'lodash.merge';

export const useStore = defineStore('main', {
  storageMap: {
    settings: 'settings',
  },
  state: () => ({
    copiedEls: {
      edges: [],
      nodes: [],
    },
    settings: {
      locale: 'en',
      deleteLogAfter: 30,
      editor: {
        minZoom: 0.6,
        maxZoom: 1.3,
        arrow: false,
        snapToGrid: false,
        lineType: 'default',
        snapGrid: { 0: 15, 1: 15 },
      },
    },
    retrieved: true,
  }),
  actions: {
    loadSettings() {
      return browser.storage.local.get('settings').then(({ settings }) => {
        this.settings = defu(settings || {}, this.settings);
        this.retrieved = true;
      });
    },
    async updateSettings(settings = {}) {
      this.settings = deepmerge(this.settings, settings);
      await this.saveToStorage('settings');
    },
  },
});

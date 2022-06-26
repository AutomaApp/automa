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
        arrow: false,
        disableCurvature: false,
        curvature: 0.5,
        reroute_curvature: 0.5,
        reroute_curvature_start_end: 0.5,
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
    updateSettings(settings = {}) {
      deepmerge(this.settings, settings);
    },
  },
});

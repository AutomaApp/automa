import { defineStore } from 'pinia';
import defu from 'defu';
import browser from 'webextension-polyfill';

export const useStore = defineStore('main', {
  state: () => ({
    user: null,
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
  }),
  actions: {
    loadSettings() {
      return browser.storage.local.get('settings').then(({ settings }) => {
        this.settings = defu(settings || {}, this.settings);
      });
    },
  },
});

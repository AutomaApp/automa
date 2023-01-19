import { defineStore } from 'pinia';
import defu from 'defu';
import browser from 'webextension-polyfill';
import deepmerge from 'lodash.merge';
import { fetchGapi } from '@/utils/api';

export const useStore = defineStore('main', {
  storageMap: {
    tabs: 'tabs',
    settings: 'settings',
  },
  state: () => ({
    tabs: [],
    copiedEls: {
      edges: [],
      nodes: [],
    },
    settings: {
      locale: 'en',
      deleteLogAfter: 30,
      logsLimit: 1000,
      editor: {
        minZoom: 0.3,
        maxZoom: 1.3,
        arrow: true,
        snapToGrid: false,
        lineType: 'default',
        snapGrid: { 0: 15, 1: 15 },
      },
    },
    integrations: {
      googleDrive: false,
    },
    integrationsRetrieved: {
      googleDrive: false,
    },
    retrieved: true,
    connectedSheets: [],
    connectedSheetsRetrieved: false,
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
    async checkGDriveIntegration(force = false) {
      try {
        if (!this.integrationsRetrieved.googleDrive && !force) return;

        const { sessionToken } = await browser.storage.local.get(
          'sessionToken'
        );
        if (!sessionToken) return;

        const response = await fetch(
          `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${sessionToken.access}`
        );
        if (!response.ok) throw new Error(response.statusText);

        const result = response.json();
        this.integrations.googleDrive =
          result.scope.includes('auth/drive.file');
      } catch (error) {
        console.error(error);
      }
    },
    async getConnectedSheets() {
      try {
        if (this.connectedSheetsRetrieved) return;

        const result = await fetchGapi(
          'https://www.googleapis.com/drive/v3/files'
        );

        this.integrations.googleDrive = true;
        this.connectedSheets = result.files.filter(
          (file) => file.mimeType === 'application/vnd.google-apps.spreadsheet'
        );
      } catch (error) {
        if (
          error.message === 'no-scope' ||
          error.message.includes('insufficient authentication')
        ) {
          this.integrations.googleDrive = false;
        }

        console.error(error);
      }
    },
  },
});

import { defineStore } from 'pinia';
import defu from 'defu';
import browser from 'webextension-polyfill';
import deepmerge from 'lodash.merge';
import { fetchGapi, fetchApi } from '@/utils/api';

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
    async checkGDriveIntegration(force = false, retryCount = 0) {
      try {
        if (this.integrationsRetrieved.googleDrive && !force) return;

        const result = await fetchGapi(
          `https://www.googleapis.com/oauth2/v1/tokeninfo`
        );
        if (!result) return;

        const isIntegrated = result.scope.includes('auth/drive.file');
        const { sessionToken } = await browser.storage.local.get(
          'sessionToken'
        );

        if (!isIntegrated && sessionToken?.refresh && retryCount < 3) {
          const response = await fetchApi(
            `/me/refresh-session?token=${sessionToken.refresh}`,
            { auth: true }
          );
          const refreshResult = await response.json();
          if (!response.ok) throw new Error(refreshResult.message);

          await browser.storage.local.set({
            sessionToken: {
              ...sessionToken,
              access: refreshResult.token,
            },
          });
          await this.checkGDriveIntegration(force, retryCount + 1);

          return;
        }

        this.integrations.googleDrive = isIntegrated;
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

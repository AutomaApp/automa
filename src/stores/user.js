import { defineStore } from 'pinia';
import browser from 'webextension-polyfill';
import { fetchApi } from '@/utils/api';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    backupIds: [],
    retrieved: false,
    hostedWorkflows: {},
  }),
  getters: {
    getHostedWorkflows: (state) => Object.values(state.hostedWorkflows),
    validateTeamAccess:
      (state) =>
      (access = []) => {
        if (!state.user?.team) return false;

        return access.some((item) => state.user.team.access.includes(item));
      },
  },
  actions: {
    async loadUser() {
      try {
        const response = await fetchApi('/me');
        const user = await response.json();

        if (!response.ok) throw new Error(response.message);

        const username = localStorage.getItem('username');
        if (!user || username !== user.username) {
          sessionStorage.removeItem('shared-workflows');
          sessionStorage.removeItem('user-workflows');
          sessionStorage.removeItem('backup-workflows');

          await browser.storage.local.remove([
            'backupIds',
            'lastSync',
            'lastBackup',
          ]);

          if (!user) {
            this.retrieved = true;
            return;
          }
        }

        localStorage.setItem('username', user?.username);

        const { backupIds } = await browser.storage.local.get('backupIds');
        this.backupIds = backupIds || [];

        this.user = user;
        this.retrieved = true;
      } catch (error) {
        this.retrieved = true;
        console.error(error);
      }
    },
  },
});

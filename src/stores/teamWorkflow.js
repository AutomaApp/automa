import { defineStore } from 'pinia';
import browser from 'webextension-polyfill';

export const useTeamWorkflowStore = defineStore('team-workflows', {
  storageMap: {
    workflows: 'teamWorkflows',
  },
  state: () => ({
    workflows: {},
    retrieved: false,
  }),
  getters: {
    toArray: (state) => Object.values(state.workflows),
    getByTeam: (state) => (teamId) => {
      if (!state.workflows) return [];

      return Object.values(state.workflows[teamId] || {});
    },
    getById: (state) => (teamId, id) => {
      if (!state.workflows || !state.workflows[teamId]) return null;

      return state.workflows[teamId][id] || null;
    },
  },
  actions: {
    insert(teamId, data) {
      if (!this.workflows[teamId]) this.workflows[teamId] = {};

      if (Array.isArray(data)) {
        data.forEach((item) => {
          this.workflows[teamId][item.id] = item;
        });
      } else {
        this.workflows[data.id] = data;
      }
    },
    update({ id, data }) {
      if (!this.workflows[id]) return null;

      Object.assign(this.workflows[id], data);

      return this.workflows[id];
    },
    async delete(teamId, id) {
      if (!this.workflows[teamId]) return;

      delete this.workflows[teamId][id];
      await this.saveToStorage('workflows');
    },
    async loadData() {
      const { teamWorkflows } = await browser.storage.local.get(
        'teamWorkflows'
      );

      this.workflows = teamWorkflows || {};
      this.retrieved = true;
    },
  },
});

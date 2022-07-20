import { defineStore } from 'pinia';
import browser from 'webextension-polyfill';
import lodashDeepmerge from 'lodash.merge';

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
    async insert(teamId, data) {
      if (!this.workflows[teamId]) this.workflows[teamId] = {};

      if (Array.isArray(data)) {
        data.forEach((item) => {
          this.workflows[teamId][item.id] = item;
        });
      } else {
        this.workflows[data.id] = data;
      }

      await this.saveToStorage('workflows');
    },
    async update({ teamId, id, data, deepmerge = false }) {
      const isWorkflowExists = Boolean(this.workflows[teamId]?.[id]);
      if (!isWorkflowExists) return null;

      if (deepmerge) {
        this.workflows[teamId][id] = lodashDeepmerge(
          this.workflows[teamId][id],
          data
        );
      } else {
        Object.assign(this.workflows[teamId][id], data);
      }

      await this.saveToStorage('workflows');

      return this.workflows[teamId][id];
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

import { defineStore } from 'pinia';
import { nanoid } from 'nanoid';
import browser from 'webextension-polyfill';
import { fetchApi } from '@/utils/api';

const defaultPackage = {
  id: '',
  name: '',
  icon: 'mdiPackageVariantClosed',
  isExtenal: false,
  content: null,
  inputs: [],
  outputs: [],
  variable: [],
  settings: {
    asBlock: false,
  },
  data: {
    edges: [],
    nodes: [],
  },
};

export const usePackageStore = defineStore('packages', {
  storageMap: {
    packages: 'savedBlocks',
  },
  state: () => ({
    packages: [],
    sharedPkgs: [],
    retrieved: false,
    sharedRetrieved: false,
  }),
  getters: {
    getById: (state) => (pkgId) => {
      return state.packages.find((pkg) => pkg.id === pkgId);
    },
    isShared: (state) => (pkgId) => {
      return state.sharedPkgs.some((pkg) => pkg.id === pkgId);
    },
  },
  actions: {
    async insert(data, newId = true) {
      const packageData = {
        ...defaultPackage,
        ...data,
        createdAt: Date.now(),
      };
      if (newId) packageData.id = nanoid();

      this.packages.push(packageData);
      await this.saveToStorage('packages');
    },
    async update({ id, data }) {
      const index = this.packages.findIndex((pkg) => pkg.id === id);
      if (index === -1) return null;

      Object.assign(this.packages[index], data);
      await this.saveToStorage('packages');

      return this.packages[index];
    },
    async delete(id) {
      const index = this.packages.findIndex((pkg) => pkg.id === id);
      if (index === -1) return null;

      const data = this.packages[index];
      this.packages.splice(index, 1);

      await this.saveToStorage('packages');

      return data;
    },
    deleteShared(id) {
      const index = this.sharedPkgs.findIndex((item) => item.id === id);
      if (index !== -1) this.sharedPkgs.splice(index, 1);
    },
    insertShared(id) {
      this.sharedPkgs.push({ id });
    },
    async loadData(force = false) {
      if (this.retrieved && !force) return this.packages;

      const { savedBlocks } = await browser.storage.local.get('savedBlocks');

      this.packages = savedBlocks || [];
      this.retrieved = true;

      return this.packages;
    },
    async loadShared() {
      try {
        if (this.sharedRetrieved) return;

        const response = await fetchApi('/me/packages');
        const result = await response.json();

        if (!response.ok) throw new Error(result.message);

        this.sharedPkgs = result;
        this.sharedRetrieved = true;
      } catch (error) {
        console.error(error.message);

        throw error;
      }
    },
  },
});

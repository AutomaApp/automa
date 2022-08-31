import { defineStore } from 'pinia';
import { nanoid } from 'nanoid';
import browser from 'webextension-polyfill';

const defaultPackage = {
  id: '',
  name: '',
  icon: '',
  isExtenal: false,
  asBlock: false,
  inputs: [],
  outputs: [],
  variable: [],
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
    retrieved: false,
  }),
  getters: {
    getById: (state) => (pkgId) => {
      return state.packages.find((pkg) => pkg.id === pkgId);
    },
  },
  actions: {
    async insert(data) {
      this.packages.push({
        ...defaultPackage,
        ...data,
        createdAt: Date.now(),
        id: nanoid(),
      });
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
    async loadData() {
      if (this.retrieved) return this.packages;

      const { savedBlocks } = await browser.storage.local.get('savedBlocks');

      this.packages = savedBlocks || [];
      this.retrieved = true;

      return this.packages;
    },
  },
});

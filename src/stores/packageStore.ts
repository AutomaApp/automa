import { create } from 'zustand';
import { nanoid } from 'nanoid';
import browser from 'webextension-polyfill';
import { fetchApi } from '@/utils/api'; // Assuming this util is available and works in React context

// Define interfaces for Package data
interface PackageNode {
  id: string;
  type?: string;
  data?: any;
  position?: { x: number; y: number };
  [key: string]: any; // Allow other properties
}

interface PackageEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  [key: string]: any; // Allow other properties
}

interface PackageIO {
  id: string;
  name: string;
  [key: string]: any;
}

interface PackageSettings {
  asBlock?: boolean;
  [key: string]: any;
}

export interface PackageData {
  id: string;
  name: string;
  icon?: string;
  isExternal?: boolean; // Note: Pinia store used isExtenal, typo? Corrected to isExternal
  content?: any; // Or a more specific type
  inputs?: PackageIO[];
  outputs?: PackageIO[];
  variables?: any[]; // Renamed from 'variable' for clarity, assuming it's a list
  settings?: PackageSettings;
  data?: { // Workflow data
    nodes: PackageNode[];
    edges: PackageEdge[];
    [key: string]: any;
  };
  createdAt?: number;
  // Any other fields that might be part of a package
  author?: string; // From BlockPackage.vue usage
}

const defaultPackage: Omit<PackageData, 'id' | 'createdAt'> = {
  name: '',
  icon: 'riBox3Line', // Changed from mdiPackageVariantClosed to match Remixicon if used elsewhere
  isExternal: false,
  content: null,
  inputs: [],
  outputs: [],
  variables: [],
  settings: {
    asBlock: false,
  },
  data: {
    edges: [],
    nodes: [],
  },
};

interface SharedPkgInfo {
  id: string;
  // other properties from API if any
}

interface PackageStoreState {
  packages: PackageData[];
  sharedPkgs: SharedPkgInfo[];
  retrieved: boolean;
  sharedRetrieved: boolean;
}

interface PackageStoreActions {
  getById: (pkgId: string) => PackageData | undefined;
  isShared: (pkgId: string) => boolean;
  insert: (data: Partial<PackageData>, newId?: boolean) => Promise<PackageData>;
  update: (id: string, data: Partial<PackageData>) => Promise<PackageData | null>;
  delete: (id: string) => Promise<PackageData | null>;
  deleteShared: (id: string) => void;
  insertShared: (id: string) => void;
  loadData: (force?: boolean) => Promise<PackageData[]>;
  loadShared: () => Promise<void>;
  // Internal helper for saving, not exposed if not needed by components
  // _savePackagesToStorage: () => Promise<void>;
}

const STORAGE_KEY = 'savedBlocks'; // From Pinia store's storageMap

export const usePackageStore = create<PackageStoreState & PackageStoreActions>((set, get) => ({
  packages: [],
  sharedPkgs: [],
  retrieved: false,
  sharedRetrieved: false,

  getById: (pkgId) => get().packages.find((pkg) => pkg.id === pkgId),

  isShared: (pkgId) => get().sharedPkgs.some((pkg) => pkg.id === pkgId),

  insert: async (data, newId = true) => {
    const packageData: PackageData = {
      ...defaultPackage,
      ...data,
      id: newId ? nanoid() : data.id || nanoid(), // Ensure ID is set
      createdAt: Date.now(),
    };

    set((state) => ({ packages: [...state.packages, packageData] }));
    await browser.storage.local.set({ [STORAGE_KEY]: get().packages });
    return packageData;
  },

  update: async (id, dataUpdate) => {
    let updatedPackage: PackageData | null = null;
    set((state) => {
      const index = state.packages.findIndex((pkg) => pkg.id === id);
      if (index === -1) return state; // Package not found

      const newPackages = [...state.packages];
      updatedPackage = { ...newPackages[index], ...dataUpdate };
      newPackages[index] = updatedPackage;

      return { packages: newPackages };
    });

    if (updatedPackage) {
      await browser.storage.local.set({ [STORAGE_KEY]: get().packages });
    }
    return updatedPackage;
  },

  delete: async (id) => {
    const pkgToDelete = get().getById(id);
    if (!pkgToDelete) return null;

    set((state) => ({
      packages: state.packages.filter((pkg) => pkg.id !== id),
    }));
    await browser.storage.local.set({ [STORAGE_KEY]: get().packages });
    return pkgToDelete;
  },

  deleteShared: (id) => {
    set((state) => ({
      sharedPkgs: state.sharedPkgs.filter((pkg) => pkg.id !== id),
    }));
    // Note: Pinia version didn't save sharedPkgs to local storage, seems to be runtime only or fetched.
  },

  insertShared: (id) => {
    // Ensure no duplicates if that's intended
    if (!get().sharedPkgs.some(p => p.id === id)) {
      set((state) => ({ sharedPkgs: [...state.sharedPkgs, { id }] }));
    }
  },

  loadData: async (force = false) => {
    if (get().retrieved && !force) return get().packages;

    try {
      const result = await browser.storage.local.get(STORAGE_KEY);
      const loadedPackages = result[STORAGE_KEY] || [];
      set({ packages: loadedPackages, retrieved: true });
      return loadedPackages;
    } catch (error) {
      console.error("Error loading packages from storage:", error);
      set({ retrieved: true }); // Avoid re-fetching on error constantly
      return [];
    }
  },

  loadShared: async () => {
    if (get().sharedRetrieved) return;

    try {
      const response = await fetchApi('/me/packages', { auth: true }); // Assuming fetchApi is set up
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Failed to fetch shared packages');

      set({ sharedPkgs: result, sharedRetrieved: true });
    } catch (error: any) {
      console.error("Error loading shared packages:", error.message);
      set({ sharedRetrieved: true }); // Avoid re-fetching on error constantly
      // Optionally re-throw or handle error state
    }
  },
}));

// Initialize store by loading data automatically when app starts
// This can be done in a main application setup file (e.g., App.tsx or main.tsx)
// For now, let's add a way to trigger initial load if not done elsewhere.
// Example: usePackageStore.getState().loadData();
// Example: usePackageStore.getState().loadShared();
// Or, you might have an effect in a root component that calls these.

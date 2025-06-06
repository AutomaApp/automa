import { create } from 'zustand';
import { nanoid } from 'nanoid';
import defu from 'defu';
import deepmerge from 'lodash.merge';
import browser from 'webextension-polyfill';
import dayjs from 'dayjs';
import { fetchApi } from '@/utils/api'; // Assuming available
import { tasks } from '@/utils/shared'; // Assuming available, contains block definitions like 'trigger'
import firstWorkflows from '@/utils/firstWorkflows'; // Assuming available
import {
  cleanWorkflowTriggers,
  registerWorkflowTrigger,
} from '@/utils/workflowTrigger'; // Assuming available

// Placeholder for UserStore interaction. In a real scenario, you'd import and use the actual Zustand user store.
const useUserStorePlaceholder = {
  getState: () => ({
    hostedWorkflows: {} as Record<string, any>,
    backupIds: [] as string[],
    removeBackupId: (id: string) => console.log(`Placeholder: removeBackupId(${id})`),
    // Add other methods if needed by workflowStore's delete action
  }),
};

// Define interfaces for Workflow data structures
// Basic Node and Edge types for drawflow content
interface DrawflowNode {
  id: string;
  label: string; // Corresponds to block type like 'trigger'
  data: any;
  position: { x: number; y: number };
  type?: string; // Component name for rendering, e.g., tasks.trigger.component
  [key: string]: any;
}

interface DrawflowEdge {
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  [key: string]: any;
}

interface WorkflowSettings {
  publicId?: string;
  blockDelay?: number;
  saveLog?: boolean;
  debugMode?: boolean;
  restartTimes?: number;
  notification?: boolean;
  execContext?: string;
  reuseLastState?: boolean;
  inputAutocomplete?: boolean;
  onError?: string;
  executedBlockOnWeb?: boolean;
  insertDefaultColumn?: boolean;
  defaultColumnName?: string;
  [key: string]: any;
}

export interface Workflow {
  id: string;
  name: string;
  icon?: string;
  folderId?: string | null;
  content?: any; // Or more specific type
  connectedTable?: any; // Or more specific type
  drawflow: {
    nodes: DrawflowNode[];
    edges: DrawflowEdge[];
    zoom?: number;
    [key: string]: any;
  };
  table?: any[]; // Define more strictly if possible
  dataColumns?: any[]; // Define more strictly if possible
  description?: string;
  trigger?: any; // Define more strictly if possible
  createdAt: number;
  updatedAt: number;
  isDisabled?: boolean;
  settings: WorkflowSettings;
  version?: string;
  globalData?: string; // JSON string
  [key: string]: any; // Allow other properties
}

// Default workflow factory function
const defaultWorkflow = (data: Partial<Workflow> | null = null, options: { duplicateId?: boolean } = {}): Workflow => {
  let workflowData: Workflow = {
    id: nanoid(),
    name: '',
    icon: 'riGlobalLine',
    folderId: null,
    content: null,
    connectedTable: null,
    drawflow: {
      edges: [],
      zoom: 1.3,
      nodes: [
        {
          position: {
            x: 100,
            // Attempt to get window height, fallback if not in browser env (e.g. test)
            y: typeof window !== 'undefined' ? window.innerHeight / 2 : 250,
          },
          id: nanoid(),
          label: 'trigger', // This is the block type ID
          data: tasks.trigger.data, // Default data for trigger block
          type: tasks.trigger.component, // Vue component name, may need adjustment for React
        },
      ],
    },
    table: [],
    dataColumns: [],
    description: '',
    trigger: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDisabled: false,
    settings: {
      publicId: '',
      blockDelay: 0,
      saveLog: true,
      debugMode: false,
      restartTimes: 3,
      notification: true,
      execContext: 'popup',
      reuseLastState: false,
      inputAutocomplete: true,
      onError: 'stop-workflow',
      executedBlockOnWeb: false,
      insertDefaultColumn: false,
      defaultColumnName: 'column',
    },
    version: typeof browser !== 'undefined' && browser.runtime ? browser.runtime.getManifest().version : '0.0.0',
    globalData: '{\n\t"key": "value"\n}',
  };

  if (data) {
    // If duplicating and original data has an ID, we want a new ID for the duplicate.
    // So, if options.duplicateId is true, we ensure the default generated ID is kept.
    // If options.duplicateId is false (or not set) and data has an ID, we use data's ID.
    let idToUse = workflowData.id; // Default to new nanoid
    if (data.id) {
        if (options.duplicateId) {
            // Keep new nanoid, effectively deleting data.id for the new copy
        } else {
            idToUse = data.id; // Use existing ID
        }
    }

    const cleanData = { ...data };
    if (options.duplicateId) delete cleanData.id;


    if (cleanData.drawflow?.nodes?.length > 0) {
      // If merging existing drawflow, ensure nodes are not simply overwritten by default trigger
      workflowData.drawflow.nodes = [];
    }

    workflowData = defu(cleanData, workflowData);
    workflowData.id = idToUse; // Ensure correct ID is set after defu
  }

  return workflowData;
};


const WORKFLOWS_STORAGE_KEY = 'workflows';
const IS_FIRST_TIME_KEY = 'isFirstTime';

interface WorkflowExecutionState {
  workflowId: string;
  // Define other properties of execution state
  [key: string]: any;
}

interface WorkflowStoreState {
  workflows: Record<string, Workflow>; // Workflows stored by ID
  states: WorkflowExecutionState[];
  popupStates: WorkflowExecutionState[];
  retrieved: boolean;
  isFirstTime: boolean | null; // null initially, then boolean
}

interface WorkflowStoreActions {
  loadData: () => Promise<void>;
  updateStates: (newStates: WorkflowExecutionState[]) => void;
  insert: (data: Partial<Workflow> | Partial<Workflow>[], options?: { duplicateId?: boolean }) => Promise<Record<string, Workflow>>;
  update: (params: { id: string | ((wf: Workflow) => boolean), data?: Partial<Workflow>, deep?: boolean }) => Promise<Record<string, Workflow>>;
  insertOrUpdate: (data: Workflow[], options?: { checkUpdateDate?: boolean, duplicateId?: boolean }) => Promise<Record<string, Workflow>>;
  delete: (id: string | string[]) => Promise<string | string[]>;

  // Getters mapped as methods
  getById: (id: string) => Workflow | undefined;
  getAllWorkflows: () => Workflow[]; // Replaces getWorkflows getter
  getWorkflowStates: (id: string) => WorkflowExecutionState[];
  getAllExecutionStates: () => WorkflowExecutionState[]; // Replaces getAllStates getter
}

export const useWorkflowStore = create<WorkflowStoreState & WorkflowStoreActions>((set, get) => ({
  workflows: {},
  states: [],
  popupStates: [],
  retrieved: false,
  isFirstTime: null,

  getById: (id) => get().workflows[id],
  getAllWorkflows: () => Object.values(get().workflows),
  getWorkflowStates: (id) => [...get().states, ...get().popupStates].filter(({ workflowId }) => workflowId === id),
  getAllExecutionStates: () => [...get().popupStates, ...get().states],

  loadData: async () => {
    if (get().retrieved) return;

    try {
      const storageResult = await browser.storage.local.get([WORKFLOWS_STORAGE_KEY, IS_FIRST_TIME_KEY]);
      let localWorkflowsData = storageResult[WORKFLOWS_STORAGE_KEY];
      let isFirst = storageResult[IS_FIRST_TIME_KEY];

      if (typeof isFirst === 'undefined') isFirst = true; // Default to true if not set

      let finalWorkflows: Workflow[] = [];
      if (isFirst && Array.isArray(firstWorkflows)) {
        finalWorkflows = firstWorkflows.map((wfData) => defaultWorkflow(wfData as Partial<Workflow>));
        await browser.storage.local.set({
          [IS_FIRST_TIME_KEY]: false,
          [WORKFLOWS_STORAGE_KEY]: finalWorkflows, // Store as array initially if that's how Pinia did
        });
        set({ isFirstTime: false });
      } else {
        finalWorkflows = Array.isArray(localWorkflowsData) ? localWorkflowsData : [];
        set({ isFirstTime: false }); // No longer first time if 'isFirstTime' was false or workflows existed
      }

      const workflowsObject = finalWorkflows.reduce((acc, wf) => {
        acc[wf.id] = wf;
        return acc;
      }, {} as Record<string, Workflow>);

      set({ workflows: workflowsObject, retrieved: true });

    } catch (error) {
      console.error("Error loading workflows:", error);
      set({ retrieved: true, isFirstTime: false }); // Avoid retry loops
    }
  },

  updateStates: (newStates) => {
    set({ states: newStates });
  },

  insert: async (data, options = {}) => {
    const newWorkflowsMap: Record<string, Workflow> = {};
    const currentWorkflows = { ...get().workflows };

    const itemsToInsert = Array.isArray(data) ? data : [data];
    itemsToInsert.forEach(item => {
      const workflow = defaultWorkflow(item as Partial<Workflow>, options);
      currentWorkflows[workflow.id] = workflow;
      newWorkflowsMap[workflow.id] = workflow;
    });

    set({ workflows: currentWorkflows });
    await browser.storage.local.set({ [WORKFLOWS_STORAGE_KEY]: Object.values(currentWorkflows) });
    return newWorkflowsMap;
  },

  update: async ({ id, data = {}, deep = false }) => {
    const updatedWorkflowsMap: Record<string, Workflow> = {};
    const currentWorkflows = { ...get().workflows };
    const updateData = { ...data, updatedAt: Date.now() };

    const applyUpdate = (workflowId: string) => {
      if (!currentWorkflows[workflowId]) return;

      if (deep) {
        currentWorkflows[workflowId] = deepmerge({}, currentWorkflows[workflowId], updateData);
      } else {
        currentWorkflows[workflowId] = { ...currentWorkflows[workflowId], ...updateData };
      }
      // Ensure updatedAt is always fresh even if not in data or if deepmerge overwrites it with older
      currentWorkflows[workflowId].updatedAt = Date.now();
      updatedWorkflowsMap[workflowId] = currentWorkflows[workflowId];

      // Handle trigger registration/cleaning
      if ('isDisabled' in updateData) {
        if (updateData.isDisabled) {
          cleanWorkflowTriggers(workflowId);
        } else {
          const triggerBlock = currentWorkflows[workflowId].drawflow.nodes?.find(node => node.label === 'trigger');
          if (triggerBlock) {
            registerWorkflowTrigger(workflowId, triggerBlock);
          }
        }
      }
    };

    if (typeof id === 'function') {
      Object.values(currentWorkflows).forEach(workflow => {
        if (id(workflow)) applyUpdate(workflow.id);
      });
    } else {
      applyUpdate(id);
    }

    set({ workflows: currentWorkflows });
    if (Object.keys(updatedWorkflowsMap).length > 0) {
      await browser.storage.local.set({ [WORKFLOWS_STORAGE_KEY]: Object.values(currentWorkflows) });
    }
    return updatedWorkflowsMap;
  },

  insertOrUpdate: async (workflowsToProcess, { checkUpdateDate = false, duplicateId = false } = {}) => {
    const processedWorkflows: Record<string, Workflow> = {};
    const currentWorkflows = { ...get().workflows };

    workflowsToProcess.forEach(item => {
      const existingWf = currentWorkflows[item.id];
      if (existingWf) {
        let shouldUpdate = true;
        if (checkUpdateDate && existingWf.updatedAt && item.updatedAt) {
          shouldUpdate = dayjs(existingWf.updatedAt).isBefore(item.updatedAt);
        }
        if (shouldUpdate) {
          currentWorkflows[item.id] = deepmerge({}, existingWf, item);
          processedWorkflows[item.id] = currentWorkflows[item.id];
        }
      } else {
        const newWf = defaultWorkflow(item, { duplicateId });
        currentWorkflows[newWf.id] = newWf;
        processedWorkflows[newWf.id] = newWf;
      }
    });

    set({ workflows: currentWorkflows });
    if (Object.keys(processedWorkflows).length > 0) {
      await browser.storage.local.set({ [WORKFLOWS_STORAGE_KEY]: Object.values(currentWorkflows) });
    }
    return processedWorkflows;
  },

  delete: async (ids) => {
    const idsToDelete = Array.isArray(ids) ? ids : [ids];
    const currentWorkflows = { ...get().workflows };
    const userStore = useUserStorePlaceholder.getState(); // Placeholder

    for (const id of idsToDelete) {
      delete currentWorkflows[id];
      await cleanWorkflowTriggers(id);

      const hostedWorkflow = userStore.hostedWorkflows[id];
      const isBackup = userStore.backupIds.includes(id);

      if (hostedWorkflow || isBackup) {
        try {
          await fetchApi(`/me/workflows?id=${id}`, { auth: true, method: 'DELETE' });
          if (isBackup) userStore.removeBackupId(id); // Placeholder for actual store action
        } catch (error) {
          console.error(`Failed to delete hosted/backup workflow ${id}:`, error);
          // Decide if you want to re-throw or just log
        }
      }
      await browser.storage.local.remove([`state:${id}`, `draft:${id}`, `draft-team:${id}`]);

      try { // Remove from pinned workflows
        const pinResult = await browser.storage.local.get('pinnedWorkflows');
        const pinnedWorkflows = pinResult.pinnedWorkflows;
        if (Array.isArray(pinnedWorkflows)) {
          const index = pinnedWorkflows.indexOf(id);
          if (index !== -1) {
            pinnedWorkflows.splice(index, 1);
            await browser.storage.local.set({ pinnedWorkflows });
          }
        }
      } catch (e) { console.error("Error removing from pinned workflows", e)}
    }

    set({ workflows: currentWorkflows });
    await browser.storage.local.set({ [WORKFLOWS_STORAGE_KEY]: Object.values(currentWorkflows) });
    return ids;
  },
}));

// Initial data loading trigger (optional, can be called from app root)
// useWorkflowStore.getState().loadData();

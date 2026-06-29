/* eslint-env browser, node, webextensions */
/* global globalThis */

const { AgentBridgeError, isPlainObject, toJsonSafe } = require('./errors');

const WORKFLOWS_KEY = 'workflows';

function getRootScope() {
  if (typeof globalThis !== 'undefined') return globalThis;
  return {};
}

const rootScope = getRootScope();

function nowMs(options = {}) {
  if (typeof options.now === 'function') return options.now();
  if (typeof options.now === 'number') return options.now;
  return Date.now();
}

function cloneValue(value, fallback = null) {
  return toJsonSafe(value, fallback);
}

function getStorage(options = {}) {
  if (options.storage) return options.storage;
  if (options.browser?.storage?.local) return options.browser.storage.local;
  if (rootScope.browser?.storage?.local) return rootScope.browser.storage.local;
  if (rootScope.chrome?.storage?.local) return rootScope.chrome.storage.local;
  return null;
}

function requireStorage(storage) {
  if (!storage || typeof storage.get !== 'function') {
    throw new AgentBridgeError('storage_error', undefined, {
      reason: 'workflow_storage_unavailable',
    });
  }
}

function normalizeWorkflowId(id) {
  if (typeof id !== 'string' || !id.trim()) {
    throw new AgentBridgeError('validation_error', undefined, {
      field: 'id',
      reason: 'workflow_id_required',
    });
  }

  return id.trim();
}

function createWorkflowId(options = {}) {
  if (typeof options.idGenerator === 'function') {
    return normalizeWorkflowId(options.idGenerator('workflow'));
  }

  const randomId =
    rootScope.crypto && typeof rootScope.crypto.randomUUID === 'function'
      ? rootScope.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `workflow_${randomId}`;
}

function workflowsToObject(workflows) {
  if (Array.isArray(workflows)) {
    return workflows.reduce((acc, workflow) => {
      if (workflow?.id) acc[workflow.id] = workflow;
      return acc;
    }, {});
  }

  return isPlainObject(workflows) ? { ...workflows } : {};
}

function normalizeCollection(workflows) {
  return {
    records: workflowsToObject(workflows),
    shape: Array.isArray(workflows) ? 'array' : 'object',
  };
}

function collectionForStorage(records, shape) {
  const clonedRecords = cloneValue(records, {});

  if (shape === 'array') return Object.values(clonedRecords);
  return clonedRecords;
}

async function storageGet(storage, key) {
  try {
    return (await storage.get(key)) || {};
  } catch (error) {
    throw new AgentBridgeError('storage_error', undefined, {
      reason: error?.message || 'workflow_storage_get_failed',
    });
  }
}

async function storageSet(storage, value) {
  if (typeof storage.set !== 'function') {
    throw new AgentBridgeError('storage_error', undefined, {
      reason: 'workflow_storage_set_unavailable',
    });
  }

  try {
    await storage.set(value);
  } catch (error) {
    throw new AgentBridgeError('storage_error', undefined, {
      reason: error?.message || 'workflow_storage_set_failed',
    });
  }
}

async function loadCollection(storage) {
  requireStorage(storage);

  const result = await storageGet(storage, WORKFLOWS_KEY);
  return normalizeCollection(result[WORKFLOWS_KEY]);
}

async function saveCollection(storage, records, shape) {
  await storageSet(storage, {
    [WORKFLOWS_KEY]: collectionForStorage(records, shape),
  });
}

function normalizeWorkflowForCreate(workflow, options = {}) {
  if (!isPlainObject(workflow)) {
    throw new AgentBridgeError('validation_error', undefined, {
      field: 'workflow',
      reason: 'workflow_must_be_object',
    });
  }

  const timestamp = nowMs(options);
  const nextWorkflow = cloneValue(workflow, {});
  nextWorkflow.id = normalizeWorkflowId(
    nextWorkflow.id || createWorkflowId(options)
  );
  if (nextWorkflow.createdAt === undefined || nextWorkflow.createdAt === null) {
    nextWorkflow.createdAt = timestamp;
  }
  if (nextWorkflow.updatedAt === undefined || nextWorkflow.updatedAt === null) {
    nextWorkflow.updatedAt = timestamp;
  }

  return nextWorkflow;
}

function normalizeWorkflowForReplace(workflow, existingWorkflow, options = {}) {
  if (!isPlainObject(workflow)) {
    throw new AgentBridgeError('validation_error', undefined, {
      field: 'workflow',
      reason: 'workflow_must_be_object',
    });
  }

  const timestamp = nowMs(options);
  const nextWorkflow = cloneValue(workflow, {});
  nextWorkflow.id = normalizeWorkflowId(nextWorkflow.id || existingWorkflow.id);
  if (nextWorkflow.createdAt === undefined || nextWorkflow.createdAt === null) {
    nextWorkflow.createdAt = existingWorkflow.createdAt ?? timestamp;
  }
  nextWorkflow.updatedAt = timestamp;

  return nextWorkflow;
}

function makeBackendStore(backend) {
  return {
    create: (...args) => backend.create(...args),
    delete: (...args) => backend.delete(...args),
    get: (...args) => backend.get(...args),
    list: (...args) => backend.list(...args),
    replace: (...args) => backend.replace(...args),
  };
}

function createWorkflowStore(options = {}) {
  if (options.backend) return makeBackendStore(options.backend);

  const storage = getStorage(options);

  return {
    async create(workflow) {
      const { records, shape } = await loadCollection(storage);
      const nextWorkflow = normalizeWorkflowForCreate(workflow, options);

      if (records[nextWorkflow.id]) {
        throw new AgentBridgeError('validation_error', undefined, {
          field: 'id',
          reason: 'workflow_exists',
          workflowId: nextWorkflow.id,
        });
      }

      records[nextWorkflow.id] = cloneValue(nextWorkflow, {});
      await saveCollection(storage, records, shape);

      return cloneValue(nextWorkflow, {});
    },

    async delete(id) {
      const workflowId = normalizeWorkflowId(id);
      const { records, shape } = await loadCollection(storage);
      const existingWorkflow = records[workflowId];

      if (!existingWorkflow) {
        throw new AgentBridgeError('workflow_not_found', undefined, {
          workflowId,
        });
      }

      delete records[workflowId];
      await saveCollection(storage, records, shape);

      return cloneValue(existingWorkflow, {});
    },

    async get(id) {
      const workflowId = normalizeWorkflowId(id);
      const { records } = await loadCollection(storage);
      const workflow = records[workflowId] || null;

      return workflow ? cloneValue(workflow, {}) : null;
    },

    async list() {
      const { records } = await loadCollection(storage);
      return Object.values(records).map((workflow) => cloneValue(workflow, {}));
    },

    async replace(id, workflow) {
      const workflowId = normalizeWorkflowId(id || workflow?.id);
      const { records, shape } = await loadCollection(storage);
      const existingWorkflow = records[workflowId];

      if (!existingWorkflow) {
        throw new AgentBridgeError('workflow_not_found', undefined, {
          workflowId,
        });
      }

      const nextWorkflow = normalizeWorkflowForReplace(
        {
          ...workflow,
          id: workflowId,
        },
        existingWorkflow,
        options
      );

      records[workflowId] = cloneValue(nextWorkflow, {});
      await saveCollection(storage, records, shape);

      return cloneValue(nextWorkflow, {});
    },
  };
}

const exported = {
  WORKFLOWS_KEY,
  createWorkflowStore,
  normalizeCollection,
  workflowsToObject,
};

module.exports = exported;
module.exports.default = exported;

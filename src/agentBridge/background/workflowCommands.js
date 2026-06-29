/* eslint-env browser, node, webextensions */

const { AgentBridgeError, isPlainObject, toJsonSafe } = require('./errors');
const { createWorkflowStore } = require('./workflowStore');

const DEFAULT_LIST_LIMIT = 100;
const MAX_LIST_LIMIT = 500;
const DEFAULT_LOG_LIMIT = 20;
const MAX_LOG_LIMIT = 100;
const DEFAULT_TABLE_LIMIT = 100;
const MAX_TABLE_LIMIT = 100;

function cloneValue(value, fallback = null) {
  return toJsonSafe(value, fallback);
}

function getPayloadId(payload = {}) {
  return payload.workflowId || payload.id;
}

function requireString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AgentBridgeError('validation_error', undefined, {
      field,
      reason: `${field}_required`,
    });
  }

  return value.trim();
}

function normalizeNonNegativeInteger(value, field, defaultValue) {
  if (value === undefined || value === null || value === '')
    return defaultValue;

  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    throw new AgentBridgeError('validation_error', undefined, {
      field,
      reason: `${field}_must_be_non_negative_integer`,
    });
  }

  return numberValue;
}

function clampLimit(value, defaultValue, maxValue) {
  const limit = normalizeNonNegativeInteger(value, 'limit', defaultValue);
  if (limit === 0) return defaultValue;
  return Math.min(limit, maxValue);
}

function getWorkflowStore(context = {}) {
  if (context.workflowStore) return context.workflowStore;

  return createWorkflowStore({
    backend: context.workflowBackend,
    browser: context.browser,
    idGenerator: context.idGenerator,
    now: context.now,
    storage: context.storage,
  });
}

async function requireWorkflow(store, id) {
  const workflowId = requireString(id, 'id');
  const workflow = await store.get(workflowId);

  if (!workflow) {
    throw new AgentBridgeError('workflow_not_found', undefined, {
      workflowId,
    });
  }

  return workflow;
}

function validateWorkflowPayload(workflow) {
  if (!isPlainObject(workflow)) {
    throw new AgentBridgeError('validation_error', undefined, {
      field: 'workflow',
      reason: 'workflow_must_be_object',
    });
  }

  if (!Object.hasOwn(workflow, 'drawflow')) {
    throw new AgentBridgeError('validation_error', undefined, {
      field: 'workflow.drawflow',
      reason: 'drawflow_required',
    });
  }

  if (
    !isPlainObject(workflow.drawflow) &&
    typeof workflow.drawflow !== 'string'
  ) {
    throw new AgentBridgeError('validation_error', undefined, {
      field: 'workflow.drawflow',
      reason: 'drawflow_must_be_object_or_string',
    });
  }

  if (
    Object.hasOwn(workflow, 'settings') &&
    workflow.settings !== null &&
    !isPlainObject(workflow.settings)
  ) {
    throw new AgentBridgeError('validation_error', undefined, {
      field: 'workflow.settings',
      reason: 'settings_must_be_object',
    });
  }
}

function parseDrawflow(drawflow) {
  if (typeof drawflow !== 'string') return drawflow;

  try {
    return JSON.parse(drawflow);
  } catch (_error) {
    return null;
  }
}

function findTriggerBlock(workflow = {}) {
  if (workflow.trigger) {
    return {
      data: workflow.trigger,
      id: 'trigger',
      label: 'trigger',
    };
  }

  const drawflow = parseDrawflow(workflow.drawflow);
  if (!drawflow) return null;

  if (drawflow.drawflow?.Home?.data) {
    return (
      Object.values(drawflow.drawflow.Home.data).find(
        (block) => block.name === 'trigger'
      ) || null
    );
  }

  if (Array.isArray(drawflow.nodes)) {
    return drawflow.nodes.find((node) => node.label === 'trigger') || null;
  }

  return null;
}

function getTriggerData(workflow) {
  const triggerBlock = findTriggerBlock(workflow);
  return triggerBlock?.data || null;
}

async function cleanWorkflowTriggers(context, workflow) {
  const registry = context.triggerRegistry || {};
  const clean =
    registry.cleanWorkflowTriggers ||
    registry.cleanUp ||
    context.cleanWorkflowTriggers;

  if (typeof clean !== 'function' || !workflow?.id) return;

  await clean(workflow.id, getTriggerData(workflow)?.triggers);
}

async function registerWorkflowTrigger(context, workflow) {
  const registry = context.triggerRegistry || {};
  const register =
    registry.registerWorkflowTrigger ||
    registry.register ||
    context.registerWorkflowTrigger;
  const triggerBlock = findTriggerBlock(workflow);

  if (typeof register !== 'function' || !workflow?.id || !triggerBlock) return;

  await register(workflow.id, {
    data: triggerBlock.data || triggerBlock,
    id: triggerBlock.id,
  });
}

function getOutlineConverter(context = {}) {
  const converter =
    context.drawflowToOutline || context.workflowModel?.drawflowToOutline;

  if (typeof converter !== 'function') {
    throw new AgentBridgeError('runtime_unavailable', undefined, {
      reason: 'outline_converter_unavailable',
    });
  }

  return converter;
}

function countWorkflowBlocks(workflow) {
  const drawflow = parseDrawflow(workflow.drawflow);
  if (Array.isArray(drawflow?.nodes)) return drawflow.nodes.length;
  if (drawflow?.drawflow?.Home?.data) {
    return Object.keys(drawflow.drawflow.Home.data).length;
  }
  return null;
}

function summarizeWorkflow(workflow) {
  return {
    createdAt: workflow.createdAt ?? null,
    id: workflow.id,
    isDisabled: workflow.isDisabled === true,
    isProtected: workflow.isProtected === true,
    name: workflow.name || '',
    nodesCount: countWorkflowBlocks(workflow),
    table: Array.isArray(workflow.table || workflow.dataColumns)
      ? cloneValue(workflow.table || workflow.dataColumns, [])
      : [],
    trigger: cloneValue(workflow.trigger || getTriggerData(workflow), null),
    updatedAt: workflow.updatedAt ?? null,
  };
}

function sortWorkflows(workflows) {
  return [...workflows].sort((a, b) => {
    const aUpdatedAt = Number(a.updatedAt || a.createdAt || 0);
    const bUpdatedAt = Number(b.updatedAt || b.createdAt || 0);

    if (aUpdatedAt !== bUpdatedAt) return bUpdatedAt - aUpdatedAt;
    return String(a.name || a.id).localeCompare(String(b.name || b.id));
  });
}

function paginate(items, { cursor = 0, limit }) {
  const start = normalizeNonNegativeInteger(cursor, 'cursor', 0);
  const page = items.slice(start, start + limit);
  const nextOffset = start + page.length;

  return {
    items: page,
    nextCursor: nextOffset < items.length ? String(nextOffset) : null,
  };
}

async function handleList({ context, envelope }) {
  const store = getWorkflowStore(context);
  const limit = clampLimit(
    envelope.payload.limit,
    DEFAULT_LIST_LIMIT,
    MAX_LIST_LIMIT
  );
  const workflows = sortWorkflows(await store.list()).map(summarizeWorkflow);
  const page = paginate(workflows, {
    cursor: envelope.payload.cursor,
    limit,
  });

  return {
    count: workflows.length,
    limit,
    nextCursor: page.nextCursor,
    workflows: page.items,
  };
}

async function handleGetRaw({ context, envelope }) {
  const store = getWorkflowStore(context);
  return requireWorkflow(store, getPayloadId(envelope.payload));
}

async function handleGetOutline({ context, envelope }) {
  const store = getWorkflowStore(context);
  const workflow = await requireWorkflow(store, getPayloadId(envelope.payload));
  const drawflowToOutline = getOutlineConverter(context);

  return drawflowToOutline(cloneValue(workflow, {}));
}

function getWorkflowPayload(envelope) {
  const workflow = envelope.payload.workflow || envelope.payload;
  validateWorkflowPayload(workflow);
  return workflow;
}

async function handleCreate({ context, envelope }) {
  const store = getWorkflowStore(context);
  const workflow = await store.create(getWorkflowPayload(envelope));
  await registerWorkflowTrigger(context, workflow);

  return workflow;
}

async function handleReplace({ context, envelope }) {
  const store = getWorkflowStore(context);
  const workflowPayload = getWorkflowPayload(envelope);
  const workflowId = getPayloadId(envelope.payload) || workflowPayload.id;
  const existingWorkflow = await requireWorkflow(store, workflowId);

  await cleanWorkflowTriggers(context, existingWorkflow);
  const workflow = await store.replace(existingWorkflow.id, workflowPayload);
  await registerWorkflowTrigger(context, workflow);

  return workflow;
}

async function handleDelete({ context, envelope }) {
  const store = getWorkflowStore(context);
  const workflow = await requireWorkflow(store, getPayloadId(envelope.payload));

  await cleanWorkflowTriggers(context, workflow);
  await store.delete(workflow.id);

  return {
    deleted: true,
    id: workflow.id,
  };
}

function getRuntime(context = {}) {
  const runtime = context.workflowRuntime || context.backgroundWorkflowUtils;
  if (
    !runtime ||
    typeof runtime.executeWorkflow !== 'function' ||
    typeof runtime.stopExecution !== 'function'
  ) {
    throw new AgentBridgeError('runtime_unavailable', undefined, {
      reason: 'workflow_runtime_unavailable',
    });
  }

  return runtime;
}

function getExecutionId(result) {
  if (typeof result === 'string') return result;
  return (
    result?.id ||
    result?.stateId ||
    result?.workflowStateId ||
    result?.executionId ||
    null
  );
}

async function handleRun({ context, envelope }) {
  const store = getWorkflowStore(context);
  const runtime = getRuntime(context);
  const workflow = await requireWorkflow(store, getPayloadId(envelope.payload));
  const result = await runtime.executeWorkflow(workflow, {});

  return {
    dispatched: true,
    stateId: getExecutionId(result),
    workflowId: workflow.id,
  };
}

async function handleStop({ context, envelope }) {
  const runtime = getRuntime(context);
  const stateId = requireString(
    envelope.payload.stateId || envelope.payload.id,
    'stateId'
  );
  const result = await runtime.stopExecution(stateId);

  return {
    result: cloneValue(result, null),
    stateId,
    stopped: true,
  };
}

function normalizeWorkflowStates(workflowStates) {
  if (Array.isArray(workflowStates)) return workflowStates;
  if (isPlainObject(workflowStates)) return Object.values(workflowStates);
  return [];
}

async function handleGetRunState({ context, envelope }) {
  const { storage } = context;
  if (!storage || typeof storage.get !== 'function') {
    throw new AgentBridgeError('storage_error', undefined, {
      reason: 'workflow_state_storage_unavailable',
    });
  }

  const result = (await storage.get('workflowStates')) || {};
  const states = normalizeWorkflowStates(result.workflowStates).map((state) =>
    cloneValue(state, {})
  );
  const id = envelope.payload.stateId || envelope.payload.id || null;
  const matches = id
    ? states.filter((state) => state.id === id || state.workflowId === id)
    : states;

  return {
    count: matches.length,
    state: id ? matches[0] || null : null,
    states: matches,
  };
}

function getLogsDb(context = {}) {
  const dbLogs = context.dbLogs || context.logsDb;
  if (
    !dbLogs?.items ||
    !dbLogs?.histories ||
    !dbLogs?.ctxData ||
    !dbLogs?.logsData
  ) {
    throw new AgentBridgeError('runtime_unavailable', undefined, {
      reason: 'logs_database_unavailable',
    });
  }

  return dbLogs;
}

async function storeToArray(store) {
  if (typeof store.toArray === 'function') return store.toArray();
  return [];
}

async function whereEquals(store, field, value) {
  if (store?.where) {
    const collection = store.where(field).equals(value);
    if (typeof collection.toArray === 'function') return collection.toArray();
    if (typeof collection.first === 'function') {
      const first = await collection.first();
      return first ? [first] : [];
    }
  }

  const rows = await storeToArray(store);
  return rows.filter((row) => row?.[field] === value);
}

async function firstWhereEquals(store, field, value) {
  if (store?.where) {
    const collection = store.where(field).equals(value);
    if (typeof collection.first === 'function') return collection.first();
    if (typeof collection.toArray === 'function') {
      const rows = await collection.toArray();
      return rows[0] || null;
    }
  }

  const rows = await whereEquals(store, field, value);
  return rows[0] || null;
}

async function getByPrimaryOrField(store, id, field = 'id') {
  if (typeof store.get === 'function') {
    const direct = await store.get(id);
    if (direct) return direct;

    const numericId = Number(id);
    if (Number.isFinite(numericId)) {
      const numericDirect = await store.get(numericId);
      if (numericDirect) return numericDirect;
    }
  }

  return firstWhereEquals(store, field, id);
}

function timeValue(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortLogsNewestFirst(logs) {
  return [...logs].sort((a, b) => {
    const endedDelta = timeValue(b.endedAt) - timeValue(a.endedAt);
    if (endedDelta !== 0) return endedDelta;
    return timeValue(b.startedAt) - timeValue(a.startedAt);
  });
}

function summarizeLog(item) {
  return {
    collectionId: item.collectionId ?? null,
    endedAt: item.endedAt ?? null,
    id: item.id,
    message: item.message || '',
    name: item.name || item.workflowName || '',
    parentLog: item.parentLog ?? null,
    startedAt: item.startedAt ?? null,
    status: item.status || 'success',
    workflowId: item.workflowId ?? null,
  };
}

async function getLogItemsForWorkflow(dbLogs, workflowId) {
  return sortLogsNewestFirst(
    await whereEquals(dbLogs.items, 'workflowId', workflowId)
  );
}

async function handleGetLogs({ context, envelope }) {
  const workflowId = requireString(getPayloadId(envelope.payload), 'id');
  const limit = clampLimit(
    envelope.payload.limit,
    DEFAULT_LOG_LIMIT,
    MAX_LOG_LIMIT
  );
  const logs = await getLogItemsForWorkflow(getLogsDb(context), workflowId);

  return {
    count: logs.length,
    limit,
    logs: logs.slice(0, limit).map(summarizeLog),
  };
}

async function readLogDetail(dbLogs, logId) {
  const item =
    (await getByPrimaryOrField(dbLogs.items, logId, 'id')) ||
    (await firstWhereEquals(dbLogs.items, 'logId', logId));

  if (!item) {
    throw new AgentBridgeError('log_not_found', undefined, {
      logId,
    });
  }

  const [history, ctxData, logsData] = await Promise.all([
    firstWhereEquals(dbLogs.histories, 'logId', logId),
    firstWhereEquals(dbLogs.ctxData, 'logId', logId),
    firstWhereEquals(dbLogs.logsData, 'logId', logId),
  ]);

  return {
    ctxData: cloneValue(ctxData, null),
    history: cloneValue(history, null),
    item: cloneValue(item, null),
    logsData: cloneValue(logsData, null),
  };
}

async function handleGetLogDetail({ context, envelope }) {
  const logId = requireString(
    envelope.payload.logId || envelope.payload.id,
    'logId'
  );
  return readLogDetail(getLogsDb(context), logId);
}

async function getSelectedLogId(dbLogs, payload) {
  if (payload.logId) return requireString(payload.logId, 'logId');

  const workflowId = requireString(getPayloadId(payload), 'id');
  const [latest] = await getLogItemsForWorkflow(dbLogs, workflowId);

  if (!latest) {
    throw new AgentBridgeError('log_not_found', undefined, {
      workflowId,
    });
  }

  return latest.id;
}

function getTableRows(logsData) {
  const table = logsData?.data?.table;
  if (Array.isArray(table)) return table;
  if (isPlainObject(table)) return Object.values(table);
  return [];
}

async function handleGetTable({ context, envelope }) {
  const dbLogs = getLogsDb(context);
  const limit = clampLimit(
    envelope.payload.limit,
    DEFAULT_TABLE_LIMIT,
    MAX_TABLE_LIMIT
  );
  const cursor = normalizeNonNegativeInteger(
    envelope.payload.cursor,
    'cursor',
    0
  );
  const logId = await getSelectedLogId(dbLogs, envelope.payload);
  const logsData = await firstWhereEquals(dbLogs.logsData, 'logId', logId);
  const rows = getTableRows(logsData);
  const page = rows
    .slice(cursor, cursor + limit)
    .map((row) => cloneValue(row, null));
  const nextOffset = cursor + page.length;

  return {
    limit,
    logId,
    nextCursor: nextOffset < rows.length ? String(nextOffset) : null,
    rows: page,
    totalRows: rows.length,
  };
}

function getDraftManager(context = {}) {
  const draftManager = context.workflowDraftManager || context.draftManager;
  if (!draftManager) {
    throw new AgentBridgeError('runtime_unavailable', undefined, {
      reason: 'workflow_draft_manager_unavailable',
    });
  }

  return draftManager;
}

async function handleBeginDraft({ context, envelope }) {
  const workflowId = requireString(getPayloadId(envelope.payload), 'id');
  return getDraftManager(context).beginDraft(workflowId);
}

async function handleAddBlock({ context, envelope }) {
  const { payload } = envelope;
  const draftId = requireString(payload.draftId, 'draftId');
  const type = requireString(payload.type, 'type');

  return getDraftManager(context).addBlock(draftId, type, {
    alias: payload.alias,
    id: payload.id,
    params: isPlainObject(payload.params) ? payload.params : {},
    sourceRef: payload.sourceRef,
  });
}

function getSourceReference(payload) {
  return payload.source || payload.sourceReference || payload.sourceRef;
}

function getTargetReference(payload) {
  return payload.target || payload.targetReference || payload.targetRef;
}

async function handleConnectBlocks({ context, envelope }) {
  const { payload } = envelope;
  const draftId = requireString(payload.draftId, 'draftId');
  const source = requireString(getSourceReference(payload), 'source');
  const target = requireString(getTargetReference(payload), 'target');

  return getDraftManager(context).connectBlocks(draftId, source, target, {
    handle: payload.handle,
    sourceHandle: payload.sourceHandle,
    targetHandle: payload.targetHandle,
  });
}

async function handleValidateDraft({ context, envelope }) {
  const draftId = requireString(envelope.payload.draftId, 'draftId');
  return getDraftManager(context).validate(
    draftId,
    isPlainObject(envelope.payload.options) ? envelope.payload.options : {}
  );
}

async function handleCommitDraft({ context, envelope }) {
  const draftId = requireString(envelope.payload.draftId, 'draftId');
  return getDraftManager(context).commitDraft(draftId);
}

function getBlockCatalog(context = {}) {
  const blockCatalog = context.blockCatalog || context.blocksCatalog;
  if (
    !blockCatalog ||
    typeof blockCatalog.listSchemas !== 'function' ||
    typeof blockCatalog.getSchema !== 'function'
  ) {
    throw new AgentBridgeError('runtime_unavailable', undefined, {
      reason: 'block_catalog_unavailable',
    });
  }

  return blockCatalog;
}

async function listBlockSchemas(context) {
  return cloneValue(await getBlockCatalog(context).listSchemas(), []);
}

async function handleBlocksList({ context, envelope }) {
  const limit = clampLimit(
    envelope.payload.limit,
    DEFAULT_LIST_LIMIT,
    MAX_LIST_LIMIT
  );
  const blocks = await listBlockSchemas(context);

  return {
    blocks: blocks.slice(0, limit),
    count: blocks.length,
    limit,
  };
}

async function handleBlocksGetSchema({ context, envelope }) {
  const type = requireString(envelope.payload.type, 'type');
  return getBlockCatalog(context).getSchema(type);
}

function schemaMatchesQuery(schema, query) {
  const haystack = [
    schema.type,
    schema.name,
    schema.alias,
    schema.category,
    schema.description,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

async function handleBlocksSearch({ context, envelope }) {
  const query = requireString(envelope.payload.query, 'query').toLowerCase();
  const limit = clampLimit(
    envelope.payload.limit,
    DEFAULT_LIST_LIMIT,
    MAX_LIST_LIMIT
  );
  const matches = (await listBlockSchemas(context)).filter((schema) =>
    schemaMatchesQuery(schema, query)
  );

  return {
    blocks: matches.slice(0, limit),
    count: matches.length,
    limit,
    query,
  };
}

const workflowCommands = {
  'blocks.getSchema': {
    capabilities: ['extension:read'],
    handler: handleBlocksGetSchema,
  },
  'blocks.list': {
    capabilities: ['extension:read'],
    handler: handleBlocksList,
  },
  'blocks.search': {
    capabilities: ['extension:read'],
    handler: handleBlocksSearch,
  },
  'workflow.addBlock': {
    capabilities: ['extension:write'],
    handler: handleAddBlock,
  },
  'workflow.beginDraft': {
    capabilities: ['extension:write'],
    handler: handleBeginDraft,
  },
  'workflow.commitDraft': {
    capabilities: ['extension:write'],
    handler: handleCommitDraft,
  },
  'workflow.connectBlocks': {
    capabilities: ['extension:write'],
    handler: handleConnectBlocks,
  },
  'workflow.create': {
    capabilities: ['extension:write'],
    handler: handleCreate,
  },
  'workflow.delete': {
    capabilities: ['extension:write'],
    handler: handleDelete,
  },
  'workflow.getLogDetail': {
    capabilities: ['runtime:read'],
    handler: handleGetLogDetail,
  },
  'workflow.getLogs': {
    capabilities: ['runtime:read'],
    handler: handleGetLogs,
  },
  'workflow.getOutline': {
    capabilities: ['extension:read'],
    handler: handleGetOutline,
  },
  'workflow.getRaw': {
    capabilities: ['extension:read'],
    handler: handleGetRaw,
  },
  'workflow.getRunState': {
    capabilities: ['runtime:read'],
    handler: handleGetRunState,
  },
  'workflow.getTable': {
    capabilities: ['runtime:read'],
    handler: handleGetTable,
  },
  'workflow.list': {
    capabilities: ['extension:read'],
    handler: handleList,
  },
  'workflow.replace': {
    capabilities: ['extension:write'],
    handler: handleReplace,
  },
  'workflow.run': {
    capabilities: ['workflow:run'],
    handler: handleRun,
  },
  'workflow.stop': {
    capabilities: ['workflow:run'],
    handler: handleStop,
  },
  'workflow.validate': {
    capabilities: ['extension:write'],
    handler: handleValidateDraft,
  },
};

const exported = {
  workflowCommands,
};

module.exports = exported;
module.exports.default = exported;

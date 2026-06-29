/* eslint-env node */

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  clearAllTrustedSessions,
  createTrustedSession,
} = require('./capabilities');
const { handleAgentCommand } = require('./router');
const { createMockStorage } = require('./testUtils');
const { createWorkflowStore } = require('./workflowStore');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function minimalWorkflow(overrides = {}) {
  return {
    createdAt: 100,
    drawflow: {
      edges: [],
      nodes: [
        {
          data: {
            type: 'manual',
          },
          id: 'trigger',
          label: 'trigger',
          position: {
            x: 100,
            y: 100,
          },
          type: 'BlockBasic',
        },
        {
          data: {
            url: 'https://example.com',
          },
          id: 'open',
          label: 'new-tab',
          position: {
            x: 380,
            y: 100,
          },
          type: 'BlockBasic',
        },
      ],
    },
    id: 'workflow-1',
    name: 'Workflow 1',
    settings: {
      saveLog: true,
    },
    updatedAt: 100,
    ...overrides,
  };
}

function makeEnvelope(command, payload = {}, sessionId = 'session-1') {
  return {
    command,
    id: `cmd_${command.replace(/[^a-z0-9]/gi, '_')}`,
    payload,
    sessionId,
  };
}

async function runCommand(command, payload, context, sessionCapabilities) {
  clearAllTrustedSessions();
  if (sessionCapabilities) {
    createTrustedSession({
      capabilities: sessionCapabilities,
      sessionId: 'session-1',
    });
  }

  return handleAgentCommand(makeEnvelope(command, payload), context);
}

function makeCollection(rows) {
  const clonedRows = rows.map((row) => clone(row));

  return {
    async first() {
      return clonedRows[0] ? clone(clonedRows[0]) : undefined;
    },
    limit(limit) {
      return makeCollection(clonedRows.slice(0, limit));
    },
    reverse() {
      return makeCollection([...clonedRows].reverse());
    },
    async sortBy(field) {
      return clonedRows
        .sort((a, b) => {
          if (a[field] < b[field]) return -1;
          if (a[field] > b[field]) return 1;
          return 0;
        })
        .map((row) => clone(row));
    },
    async toArray() {
      return clonedRows.map((row) => clone(row));
    },
  };
}

function makeDexieStore(rows = []) {
  const clonedRows = rows.map((row) => clone(row));

  return {
    async get(id) {
      const row = clonedRows.find((item) => item.id === id);
      return row ? clone(row) : undefined;
    },
    async toArray() {
      return clonedRows.map((row) => clone(row));
    },
    where(field) {
      return {
        equals(value) {
          return makeCollection(
            clonedRows.filter((row) => row[field] === value)
          );
        },
      };
    },
  };
}

function makeLogsDb({
  ctxData = [],
  histories = [],
  items = [],
  logsData = [],
}) {
  return {
    ctxData: makeDexieStore(ctxData),
    histories: makeDexieStore(histories),
    items: makeDexieStore(items),
    logsData: makeDexieStore(logsData),
  };
}

test.beforeEach(() => {
  clearAllTrustedSessions();
});

test('workflow store preserves raw shape, array storage, missing reads, and backend injection', async () => {
  const workflow = minimalWorkflow();
  const storage = createMockStorage({
    workflows: [clone(workflow)],
  });
  const store = createWorkflowStore({
    idGenerator: () => 'created-workflow',
    now: 200,
    storage,
  });

  const storedWorkflow = await store.get('workflow-1');
  storedWorkflow.drawflow.nodes[1].data.url = 'https://mutated.invalid';

  assert.equal(
    storage.store.workflows[0].drawflow.nodes[1].data.url,
    'https://example.com'
  );
  assert.equal(await store.get('missing-workflow'), null);

  const created = await store.create(
    minimalWorkflow({
      createdAt: undefined,
      id: undefined,
      name: 'Created',
      updatedAt: undefined,
    })
  );

  assert.equal(created.id, 'created-workflow');
  assert.equal(created.createdAt, 200);
  assert.equal(created.updatedAt, 200);
  assert.equal(Array.isArray(storage.store.workflows), true);
  assert.equal(storage.store.workflows.length, 2);

  const backendStore = createWorkflowStore({
    backend: {
      create: async (item) => item,
      delete: async () => null,
      get: async () => null,
      list: async () => [{ id: 'offline' }],
      replace: async (_id, item) => item,
    },
  });

  assert.deepEqual(await backendStore.list(), [{ id: 'offline' }]);
});

test('workflow read commands list metadata, return raw workflows, and convert outlines without mutation', async () => {
  const workflow = minimalWorkflow();
  const storage = createMockStorage({
    workflows: {
      'workflow-1': clone(workflow),
      'workflow-2': minimalWorkflow({
        id: 'workflow-2',
        name: 'Workflow 2',
        updatedAt: 300,
      }),
    },
  });
  const converterCalls = [];
  const context = {
    drawflowToOutline: (currentWorkflow) => {
      converterCalls.push(currentWorkflow);
      currentWorkflow.drawflow.nodes[1].data.url = 'https://changed.invalid';
      return {
        id: currentWorkflow.id,
        kind: 'workflow_outline',
        nodesCount: currentWorkflow.drawflow.nodes.length,
      };
    },
    storage,
  };

  const listResponse = await runCommand('workflow.list', {}, context, [
    'extension:read',
  ]);

  assert.equal(listResponse.ok, true);
  assert.deepEqual(
    listResponse.data.workflows.map((item) => item.id),
    ['workflow-2', 'workflow-1']
  );
  assert.equal(
    Object.hasOwn(listResponse.data.workflows[0], 'drawflow'),
    false
  );
  assert.equal(listResponse.data.workflows[0].nodesCount, 2);

  const rawResponse = await runCommand(
    'workflow.getRaw',
    {
      id: 'workflow-1',
    },
    context,
    ['extension:read']
  );

  assert.equal(rawResponse.ok, true);
  assert.equal(rawResponse.data.id, 'workflow-1');
  assert.deepEqual(rawResponse.data.drawflow.nodes, workflow.drawflow.nodes);

  const outlineResponse = await runCommand(
    'workflow.getOutline',
    {
      id: 'workflow-1',
    },
    context,
    ['extension:read']
  );

  assert.equal(outlineResponse.ok, true);
  assert.deepEqual(outlineResponse.data, {
    id: 'workflow-1',
    kind: 'workflow_outline',
    nodesCount: 2,
  });
  assert.equal(converterCalls.length, 1);
  assert.equal(
    storage.store.workflows['workflow-1'].drawflow.nodes[1].data.url,
    'https://example.com'
  );

  const missingResponse = await runCommand(
    'workflow.getRaw',
    {
      id: 'missing-workflow',
    },
    context,
    ['extension:read']
  );

  assert.equal(missingResponse.ok, false);
  assert.equal(missingResponse.errors[0].code, 'workflow_not_found');
});

test('workflow mutation commands create, replace, delete, and manage trigger side effects', async () => {
  const storage = createMockStorage({
    workflows: {
      'workflow-1': minimalWorkflow(),
    },
  });
  const registered = [];
  const cleaned = [];
  const context = {
    now: 500,
    storage,
    triggerRegistry: {
      cleanWorkflowTriggers: async (...args) => cleaned.push(args),
      registerWorkflowTrigger: async (...args) => registered.push(args),
    },
  };

  const createdResponse = await runCommand(
    'workflow.create',
    {
      workflow: minimalWorkflow({
        createdAt: undefined,
        id: 'workflow-2',
        name: 'Created workflow',
        updatedAt: undefined,
      }),
    },
    context,
    ['extension:write']
  );

  assert.equal(createdResponse.ok, true);
  assert.equal(createdResponse.data.id, 'workflow-2');
  assert.equal(createdResponse.data.createdAt, 500);
  assert.equal(storage.store.workflows['workflow-2'].name, 'Created workflow');
  assert.equal(registered.length, 1);
  assert.equal(registered[0][0], 'workflow-2');
  assert.equal(registered[0][1].data.type, 'manual');

  const duplicateResponse = await runCommand(
    'workflow.create',
    {
      workflow: minimalWorkflow({
        id: 'workflow-2',
      }),
    },
    context,
    ['extension:write']
  );

  assert.equal(duplicateResponse.ok, false);
  assert.equal(duplicateResponse.errors[0].code, 'validation_error');
  assert.equal(duplicateResponse.errors[0].reason, 'workflow_exists');

  const replaceResponse = await runCommand(
    'workflow.replace',
    {
      id: 'workflow-1',
      workflow: minimalWorkflow({
        id: 'workflow-1',
        name: 'Replaced workflow',
        updatedAt: 123,
      }),
    },
    context,
    ['extension:write']
  );

  assert.equal(replaceResponse.ok, true);
  assert.equal(replaceResponse.data.name, 'Replaced workflow');
  assert.equal(replaceResponse.data.createdAt, 100);
  assert.equal(replaceResponse.data.updatedAt, 500);
  assert.equal(cleaned.length, 1);
  assert.equal(registered.length, 2);

  const deleteResponse = await runCommand(
    'workflow.delete',
    {
      id: 'workflow-1',
    },
    context,
    ['extension:write']
  );

  assert.equal(deleteResponse.ok, true);
  assert.equal(deleteResponse.data.deleted, true);
  assert.equal(storage.store.workflows['workflow-1'], undefined);
  assert.equal(cleaned.length, 2);
});

test('workflow draft commands delegate to injected draft manager', async () => {
  const calls = [];
  const context = {
    workflowDraftManager: {
      addBlock: async (...args) => {
        calls.push(['addBlock', ...args]);
        return {
          alias: args[2].alias,
          id: 'node-1',
          type: args[1],
        };
      },
      beginDraft: async (...args) => {
        calls.push(['beginDraft', ...args]);
        return {
          draftId: 'draft-1',
          workflowId: args[0],
        };
      },
      commitDraft: async (...args) => {
        calls.push(['commitDraft', ...args]);
        return {
          draftId: args[0],
          workflowId: 'workflow-1',
        };
      },
      connectBlocks: async (...args) => {
        calls.push(['connectBlocks', ...args]);
        return {
          source: args[1],
          target: args[2],
        };
      },
      validate: async (...args) => {
        calls.push(['validate', ...args]);
        return {
          errors: [],
          valid: true,
          warnings: [],
        };
      },
    },
  };

  const beginResponse = await runCommand(
    'workflow.beginDraft',
    {
      workflowId: 'workflow-1',
    },
    context,
    ['extension:write']
  );
  assert.equal(beginResponse.ok, true);
  assert.deepEqual(beginResponse.data, {
    draftId: 'draft-1',
    workflowId: 'workflow-1',
  });

  const addResponse = await runCommand(
    'workflow.addBlock',
    {
      alias: 'open_site',
      draftId: 'draft-1',
      params: {
        url: 'https://example.com',
      },
      type: 'new-tab',
    },
    context,
    ['extension:write']
  );
  assert.equal(addResponse.ok, true);

  const connectResponse = await runCommand(
    'workflow.connectBlocks',
    {
      draftId: 'draft-1',
      handle: '2',
      source: 'open_site',
      target: 'extract_title',
    },
    context,
    ['extension:write']
  );
  assert.equal(connectResponse.ok, true);

  const validateResponse = await runCommand(
    'workflow.validate',
    {
      draftId: 'draft-1',
    },
    context,
    ['extension:write']
  );
  assert.equal(validateResponse.data.valid, true);

  const commitResponse = await runCommand(
    'workflow.commitDraft',
    {
      draftId: 'draft-1',
    },
    context,
    ['extension:write']
  );
  assert.equal(commitResponse.ok, true);

  assert.deepEqual(calls, [
    ['beginDraft', 'workflow-1'],
    [
      'addBlock',
      'draft-1',
      'new-tab',
      {
        alias: 'open_site',
        id: undefined,
        params: {
          url: 'https://example.com',
        },
        sourceRef: undefined,
      },
    ],
    [
      'connectBlocks',
      'draft-1',
      'open_site',
      'extract_title',
      {
        handle: '2',
        sourceHandle: undefined,
        targetHandle: undefined,
      },
    ],
    ['validate', 'draft-1', {}],
    ['commitDraft', 'draft-1'],
  ]);
});

test('block catalog commands delegate to injected catalog and bound search results', async () => {
  const schemas = [
    {
      category: 'browser',
      description: 'Open a tab',
      name: 'New Tab',
      type: 'new-tab',
    },
    {
      category: 'web',
      description: 'Extract text',
      name: 'Get Text',
      type: 'get-text',
    },
    {
      category: 'data',
      description: 'Log data',
      name: 'Log Data',
      type: 'log-data',
    },
  ];
  const context = {
    blockCatalog: {
      getSchema: (type) => schemas.find((schema) => schema.type === type),
      listSchemas: () => schemas,
    },
  };

  const listResponse = await runCommand(
    'blocks.list',
    {
      limit: 2,
    },
    context,
    ['extension:read']
  );
  assert.equal(listResponse.ok, true);
  assert.equal(listResponse.data.count, 3);
  assert.deepEqual(
    listResponse.data.blocks.map((schema) => schema.type),
    ['new-tab', 'get-text']
  );

  const schemaResponse = await runCommand(
    'blocks.getSchema',
    {
      type: 'new-tab',
    },
    context,
    ['extension:read']
  );
  assert.deepEqual(schemaResponse.data, schemas[0]);

  const searchResponse = await runCommand(
    'blocks.search',
    {
      limit: 1,
      query: 'text',
    },
    context,
    ['extension:read']
  );
  assert.equal(searchResponse.data.count, 1);
  assert.deepEqual(searchResponse.data.blocks, [schemas[1]]);
});

test('workflow commands enforce capabilities and standard redacted error envelopes', async () => {
  const storage = createMockStorage({
    workflows: {
      'workflow-1': minimalWorkflow(),
    },
  });

  const deniedResponse = await runCommand(
    'workflow.create',
    {
      workflow: minimalWorkflow({
        id: 'workflow-2',
      }),
    },
    {
      storage,
    },
    ['extension:read']
  );

  assert.equal(deniedResponse.ok, false);
  assert.equal(deniedResponse.errors[0].code, 'missing_capability');
  assert.equal(deniedResponse.errors[0].capability, 'extension:write');

  const invalidResponse = await runCommand(
    'workflow.create',
    {
      workflow: [],
    },
    {
      storage,
    },
    ['extension:write']
  );

  assert.equal(invalidResponse.ok, false);
  assert.equal(invalidResponse.errors[0].code, 'validation_error');
  assert.equal(invalidResponse.errors[0].field, 'workflow');

  const internalErrorResponse = await runCommand(
    'workflow.list',
    {},
    {
      storage,
      workflowStore: {
        list: async () => {
          throw new Error('password=secret should not leak');
        },
      },
    },
    ['extension:read']
  );

  assert.equal(internalErrorResponse.ok, false);
  assert.deepEqual(internalErrorResponse.errors, [
    {
      code: 'handler_error',
      message: 'Command handler failed',
    },
  ]);
});

test('workflow runtime commands run, stop, and read workflow state storage', async () => {
  const storage = createMockStorage({
    workflowStates: [
      {
        id: 'state-1',
        status: 'running',
        workflowId: 'workflow-1',
      },
    ],
    workflows: {
      'workflow-1': minimalWorkflow(),
    },
  });
  const executed = [];
  const stopped = [];
  const context = {
    storage,
    workflowRuntime: {
      executeWorkflow: async (workflow, options) => {
        executed.push([workflow, options]);
        return {
          id: 'state-1',
        };
      },
      stopExecution: async (stateId) => {
        stopped.push(stateId);
        return stateId;
      },
    },
  };

  const runResponse = await runCommand(
    'workflow.run',
    {
      id: 'workflow-1',
    },
    context,
    ['workflow:run']
  );

  assert.equal(runResponse.ok, true);
  assert.equal(runResponse.data.dispatched, true);
  assert.equal(runResponse.data.stateId, 'state-1');
  assert.equal(executed[0][0].id, 'workflow-1');
  assert.deepEqual(executed[0][1], {});

  const stopResponse = await runCommand(
    'workflow.stop',
    {
      stateId: 'state-1',
    },
    context,
    ['workflow:run']
  );

  assert.equal(stopResponse.ok, true);
  assert.equal(stopResponse.data.stopped, true);
  assert.deepEqual(stopped, ['state-1']);

  const stateResponse = await runCommand(
    'workflow.getRunState',
    {
      id: 'workflow-1',
    },
    context,
    ['runtime:read']
  );

  assert.equal(stateResponse.ok, true);
  assert.equal(stateResponse.data.state.id, 'state-1');
  assert.equal(stateResponse.data.count, 1);

  const missingWorkflowResponse = await runCommand(
    'workflow.run',
    {
      id: 'missing-workflow',
    },
    context,
    ['workflow:run']
  );

  assert.equal(missingWorkflowResponse.ok, false);
  assert.equal(missingWorkflowResponse.errors[0].code, 'workflow_not_found');

  const unavailableResponse = await runCommand(
    'workflow.run',
    {
      id: 'workflow-1',
    },
    {
      storage,
    },
    ['workflow:run']
  );

  assert.equal(unavailableResponse.ok, false);
  assert.equal(unavailableResponse.errors[0].code, 'runtime_unavailable');
});

test('workflow log commands return newest bounded summaries and selected log detail', async () => {
  const items = Array.from({ length: 120 }, (_item, index) => ({
    endedAt: 1000 + index,
    id: `log-${index}`,
    message: `message-${index}`,
    name: `Run ${index}`,
    startedAt: 500 + index,
    status: index % 2 === 0 ? 'success' : 'error',
    workflowId: 'workflow-1',
  }));
  const dbLogs = makeLogsDb({
    ctxData: [
      {
        data: {
          ctxData: {
            1: {
              replacedValue: 'value',
            },
          },
        },
        logId: 'log-119',
      },
    ],
    histories: [
      {
        data: [
          {
            id: 1,
            name: 'new-tab',
          },
        ],
        logId: 'log-119',
      },
    ],
    items,
    logsData: [
      {
        data: {
          table: [
            {
              title: 'Result',
            },
          ],
        },
        logId: 'log-119',
      },
    ],
  });

  const defaultLogsResponse = await runCommand(
    'workflow.getLogs',
    {
      id: 'workflow-1',
    },
    {
      dbLogs,
      storage: createMockStorage(),
    },
    ['runtime:read']
  );

  assert.equal(defaultLogsResponse.ok, true);
  assert.equal(defaultLogsResponse.data.logs.length, 20);
  assert.equal(defaultLogsResponse.data.logs[0].id, 'log-119');
  assert.equal(defaultLogsResponse.data.logs[19].id, 'log-100');

  const clampedLogsResponse = await runCommand(
    'workflow.getLogs',
    {
      id: 'workflow-1',
      limit: 999,
    },
    {
      dbLogs,
      storage: createMockStorage(),
    },
    ['runtime:read']
  );

  assert.equal(clampedLogsResponse.data.limit, 100);
  assert.equal(clampedLogsResponse.data.logs.length, 100);

  const detailResponse = await runCommand(
    'workflow.getLogDetail',
    {
      logId: 'log-119',
    },
    {
      dbLogs,
      storage: createMockStorage(),
    },
    ['runtime:read']
  );

  assert.equal(detailResponse.ok, true);
  assert.equal(detailResponse.data.item.id, 'log-119');
  assert.equal(detailResponse.data.history.data[0].name, 'new-tab');
  assert.equal(
    detailResponse.data.ctxData.data.ctxData[1].replacedValue,
    'value'
  );
  assert.equal(detailResponse.data.logsData.data.table[0].title, 'Result');

  const missingDetailResponse = await runCommand(
    'workflow.getLogDetail',
    {
      logId: 'missing-log',
    },
    {
      dbLogs,
      storage: createMockStorage(),
    },
    ['runtime:read']
  );

  assert.equal(missingDetailResponse.ok, false);
  assert.equal(missingDetailResponse.errors[0].code, 'log_not_found');
});

test('workflow table command reads latest log table with bounded cursor pagination', async () => {
  const rows = Array.from({ length: 105 }, (_item, index) => ({
    index,
    value: `row-${index}`,
  }));
  const dbLogs = makeLogsDb({
    items: [
      {
        endedAt: 200,
        id: 'latest-log',
        workflowId: 'workflow-1',
      },
      {
        endedAt: 100,
        id: 'older-log',
        workflowId: 'workflow-1',
      },
    ],
    logsData: [
      {
        data: {
          table: rows,
        },
        logId: 'latest-log',
      },
      {
        data: {
          table: [],
        },
        logId: 'empty-log',
      },
    ],
  });
  const context = {
    dbLogs,
    storage: createMockStorage(),
  };

  const firstPageResponse = await runCommand(
    'workflow.getTable',
    {
      id: 'workflow-1',
    },
    context,
    ['runtime:read']
  );

  assert.equal(firstPageResponse.ok, true);
  assert.equal(firstPageResponse.data.logId, 'latest-log');
  assert.equal(firstPageResponse.data.rows.length, 100);
  assert.equal(firstPageResponse.data.rows[0].value, 'row-0');
  assert.equal(firstPageResponse.data.nextCursor, '100');

  const secondPageResponse = await runCommand(
    'workflow.getTable',
    {
      cursor: '100',
      limit: 500,
      logId: 'latest-log',
    },
    context,
    ['runtime:read']
  );

  assert.equal(secondPageResponse.ok, true);
  assert.equal(secondPageResponse.data.limit, 100);
  assert.equal(secondPageResponse.data.rows.length, 5);
  assert.equal(secondPageResponse.data.rows[0].value, 'row-100');
  assert.equal(secondPageResponse.data.nextCursor, null);

  const emptyTableResponse = await runCommand(
    'workflow.getTable',
    {
      logId: 'empty-log',
    },
    context,
    ['runtime:read']
  );

  assert.equal(emptyTableResponse.ok, true);
  assert.equal(emptyTableResponse.data.rows.length, 0);
  assert.equal(emptyTableResponse.data.nextCursor, null);
});

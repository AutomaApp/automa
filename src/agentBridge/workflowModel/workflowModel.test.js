/* eslint-env node */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { loadSourceModule } = require('../../utils/testBabelLoader');
const { createMockStorage } = require('../background/testUtils');

const {
  createWorkflowDraftManager,
  deleteAlias,
  drawflowToOutline,
  getAliases,
  outlineToDrawflow,
  placeBlock,
  revision,
  setAlias,
  stableHash,
  validateAliases,
  validateOutlineStructure,
} = loadSourceModule('./index', __filename);

const fixturePath = path.resolve(
  __dirname,
  '../../../workflows/chatgpt-deep-research.automa.json'
);
const fixtureWorkflow = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function minimalWorkflow(overrides = {}) {
  return {
    id: 'minimal',
    name: 'Minimal',
    settings: {
      saveLog: true,
    },
    updatedAt: 1000,
    drawflow: {
      edges: [
        {
          id: 'vueflow__edge-trigger-output-1-open-input-1',
          source: 'trigger',
          sourceHandle: 'trigger-output-1',
          target: 'open',
          targetHandle: 'open-input-1',
        },
      ],
      nodes: [
        {
          data: {
            activeInInput: false,
            contextMenuName: '',
            contextTypes: [],
            date: '',
            days: [],
            delay: 5,
            description: '',
            disableBlock: false,
            interval: 60,
            isUrlRegex: false,
            parameters: [],
            preferParamsInTab: false,
            shortcut: '',
            time: '00:00',
            type: 'manual',
            url: '',
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
            active: true,
            customUserAgent: false,
            description: '',
            disableBlock: false,
            inGroup: false,
            tabZoom: 1,
            updatePrevTab: false,
            url: 'https://example.com',
            userAgent: '',
            waitTabLoaded: false,
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
      zoom: 1.3,
    },
    ...overrides,
  };
}

function createManager(workflow, options = {}) {
  const storage = createMockStorage({
    workflows: {
      [workflow.id]: clone(workflow),
    },
  });
  const ids = [...(options.ids || [])];
  const manager = createWorkflowDraftManager({
    idGenerator: (prefix) => ids.shift() || `${prefix}-${ids.length}`,
    now: options.now || 9999,
    registerWorkflowTrigger: options.registerWorkflowTrigger,
    storage,
  });

  return {
    manager,
    storage,
  };
}

test('creates outline records and revisions without mutating drawflow input', () => {
  const workflow = clone(fixtureWorkflow);
  const outline = drawflowToOutline(workflow);

  assert.equal(outline.kind, 'workflow_outline');
  assert.equal(outline.revision, 'updatedAt:1710000005000');
  assert.equal(outline.blocks.length, workflow.drawflow.nodes.length);
  assert.equal(outline.connections.length, workflow.drawflow.edges.length);
  assert.equal(outline.blocks[1].id, 'node-open');
  assert.equal(outline.blocks[1].type, 'new-tab');
  assert.equal(outline.blocks[1].component, 'BlockBasic');
  assert.equal(outline.blocks[1].alias, 'open_chatgpt');
  assert.deepEqual(outline.blocks[1].position, { x: 380, y: 200 });
  assert.equal(
    outline.connections.find((item) => item.id.includes('has-answer')).output,
    'has-answer'
  );
  assert.equal(
    outline.connections.find((item) => item.sourceHandle.endsWith('fallback'))
      .output,
    'fallback'
  );

  outline.blocks[1].params.url = 'changed';
  assert.equal(workflow.drawflow.nodes[1].data.url, 'https://chatgpt.com/');
});

test('revision falls back to deterministic stable content hashes', () => {
  const first = {
    drawflow: {
      edges: [],
      nodes: [{ id: 'a', data: { b: 1, a: 2 } }],
    },
    id: 'hash-only',
  };
  const second = {
    id: 'hash-only',
    drawflow: {
      nodes: [{ data: { a: 2, b: 1 }, id: 'a' }],
      edges: [],
    },
  };

  assert.equal(revision(first), revision(second));
  assert.match(revision(first), /^hash:/);
  assert.equal(stableHash({ b: 1, a: 2 }), stableHash({ a: 2, b: 1 }));
});

test('round-trips drawflow with node ids, handles, unknown UI fields, and settings preserved', () => {
  const workflow = clone(fixtureWorkflow);
  const outline = drawflowToOutline(workflow);
  const roundTrip = outlineToDrawflow(outline, workflow);

  assert.deepEqual(
    roundTrip.drawflow.nodes.map((node) => node.id),
    workflow.drawflow.nodes.map((node) => node.id)
  );
  assert.deepEqual(
    roundTrip.drawflow.edges.map((edge) => [
      edge.id,
      edge.sourceHandle,
      edge.targetHandle,
    ]),
    workflow.drawflow.edges.map((edge) => [
      edge.id,
      edge.sourceHandle,
      edge.targetHandle,
    ])
  );
  assert.deepEqual(roundTrip.drawflow.nodes[0].handleBounds, {
    source: [{ id: 'node-trigger-output-1' }],
    target: [],
  });
  assert.deepEqual(roundTrip.drawflow.nodes[6].unknownUiField, {
    preserved: true,
  });
  assert.equal(roundTrip.drawflow.zoom, 0.85);
  assert.deepEqual(roundTrip.settings.customSetting, { keep: true });
  assert.equal(
    roundTrip.settings.agentBridge.notes,
    'preserve unrelated bridge metadata'
  );
});

test('persists, renames, deletes, and validates aliases without touching unrelated settings', () => {
  const settings = {
    agentBridge: {
      aliases: {
        one: 'first',
      },
      token: 'keep',
    },
    saveLog: true,
  };
  const renamed = setAlias(settings, 'two', 'second');
  const deleted = deleteAlias(renamed, 'one');

  assert.deepEqual(getAliases({ settings: renamed }), {
    one: 'first',
    two: 'second',
  });
  assert.deepEqual(getAliases({ settings: deleted }), {
    two: 'second',
  });
  assert.equal(deleted.agentBridge.token, 'keep');
  assert.equal(deleted.saveLog, true);

  assert.deepEqual(validateAliases({ a: 'same', b: 'same' }).errors, [
    {
      alias: 'same',
      code: 'duplicate_alias',
      nodeId: 'b',
      otherNodeId: 'a',
      severity: 'error',
    },
  ]);
  assert.equal(
    validateAliases({ a: 'same', b: 'same' }, { strict: false }).warnings[0]
      .severity,
    'warning'
  );
});

test('validates outline structure and detects malformed workflows', () => {
  const valid = validateOutlineStructure(drawflowToOutline(minimalWorkflow()));
  assert.equal(valid.valid, true);

  const malformed = drawflowToOutline(
    minimalWorkflow({
      drawflow: {
        edges: [
          {
            id: 'bad',
            source: 'missing',
            sourceHandle: 'missing-output-1',
            target: 'open',
            targetHandle: 'open-input-1',
          },
        ],
        nodes: [
          {
            data: {},
            id: 'open',
            label: 'new-tab',
            position: { x: 0, y: 0 },
            type: 'BlockBasic',
          },
        ],
      },
      updatedAt: null,
    })
  );
  const result = validateOutlineStructure(malformed);

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors.map((error) => error.code).sort(), [
    'missing_connection_source',
    'missing_trigger',
  ]);
});

test('places new blocks deterministically near sources and avoids collisions', () => {
  const blocks = [
    { id: 'source', position: { x: 100, y: 100 } },
    { id: 'occupied', position: { x: 380, y: 100 } },
    { id: 'occupied-down', position: { x: 380, y: 260 } },
  ];

  assert.deepEqual(placeBlock(blocks, { sourceId: 'source' }), {
    x: 380,
    y: -60,
  });
  assert.deepEqual(placeBlock(blocks, { sourceId: 'source' }), {
    x: 380,
    y: -60,
  });
  assert.deepEqual(blocks[0].position, { x: 100, y: 100 });
});

test('draft lifecycle clones live workflows, validates, diffs, and discards without storage writes', async () => {
  const { manager, storage } = createManager(minimalWorkflow(), {
    ids: ['draft-1'],
  });
  const draft = await manager.beginDraft('minimal');

  assert.equal(draft.draftId, 'draft-1');
  assert.equal(draft.baseRevision, 'updatedAt:1000');

  const validation = await manager.validate('draft-1');
  assert.equal(validation.valid, true);
  assert.equal(manager.diffDraft('draft-1').changed, false);

  const state = manager.getDraftState('draft-1');
  state.outline.blocks[1].params.url = 'mutated elsewhere';
  assert.equal(
    storage.store.workflows.minimal.drawflow.nodes[1].data.url,
    'https://example.com'
  );

  assert.equal(manager.discardDraft('draft-1'), true);
  assert.throws(() => manager.getDraftState('draft-1'), /draft_not_found/);
});

test('adds, updates, removes, and rejects blocks while keeping mutations draft-only', async () => {
  const { manager, storage } = createManager(minimalWorkflow(), {
    ids: ['draft-1', 'node-added'],
  });
  await manager.beginDraft('minimal');

  const block = await manager.addBlock('draft-1', 'new-tab', {
    alias: 'second_page',
    params: {
      url: 'https://example.org',
    },
  });
  assert.equal(block.id, 'node-added');
  assert.equal(block.params.url, 'https://example.org');
  assert.equal(block.params.active, true);

  const updated = await manager.updateBlock('draft-1', 'second_page', {
    alias: 'renamed_page',
    params: {
      active: false,
    },
  });
  assert.equal(updated.alias, 'renamed_page');
  assert.equal(updated.params.active, false);

  await assert.rejects(
    manager.addBlock('draft-1', 'missing-block', {
      unsafeRaw: false,
    }),
    { code: 'validation_error' }
  );
  await assert.rejects(
    manager.updateBlock('draft-1', 'open', {
      alias: 'renamed_page',
    }),
    { code: 'duplicate_alias' }
  );

  manager.connectBlocks('draft-1', 'trigger', 'renamed_page');
  assert.equal(manager.diffDraft('draft-1').changed, true);
  manager.removeBlock('draft-1', 'renamed_page');
  const state = manager.getDraftState('draft-1');
  assert.equal(
    state.outline.blocks.some((item) => item.id === 'node-added'),
    false
  );
  assert.equal(
    state.outline.connections.some((item) => item.target === 'node-added'),
    false
  );
  assert.equal(storage.store.workflows.minimal.drawflow.nodes.length, 2);
});

test('connects, disconnects, appends, and inserts with explicit branch handles', async () => {
  const workflow = clone(fixtureWorkflow);
  const { manager } = createManager(workflow, {
    ids: ['draft-1', 'node-appended', 'node-inserted'],
  });
  await manager.beginDraft('chatgpt-deep-research');

  const appended = await manager.appendBlock('draft-1', 'retry_loop', 'delay', {
    alias: 'after_retry',
    handle: '2',
    params: {
      time: 750,
    },
  });
  assert.equal(appended.connection.sourceHandle, 'node-repeat-output-2');
  assert.equal(appended.connection.targetHandle, 'node-appended-input-1');

  const fallback = manager.connectBlocks('draft-1', 'decide', 'after_retry', {
    sourceHandle: 'fallback',
  });
  assert.equal(fallback.sourceHandle, 'node-condition-output-fallback');

  const disconnected = manager.disconnectBlocks(
    'draft-1',
    'decide',
    'after_retry',
    { sourceHandle: 'fallback' }
  );
  assert.deepEqual(disconnected.removed, [
    'vueflow__edge-node-condition-output-fallback-node-appended-input-1',
  ]);

  const inserted = await manager.insertBlock(
    'draft-1',
    'start',
    'open_chatgpt',
    'delay',
    {
      alias: 'pre_open_delay',
      params: {
        time: 100,
      },
    }
  );
  const state = manager.getDraftState('draft-1');
  assert.deepEqual(inserted.removedConnectionIds, [
    'vueflow__edge-node-trigger-output-1-node-open-input-1',
  ]);
  assert.equal(
    state.outline.connections.some(
      (connection) =>
        connection.source === 'node-trigger' &&
        connection.target === 'node-open'
    ),
    false
  );
  assert.equal(inserted.sourceToInserted.sourceHandle, 'node-trigger-output-1');
  assert.equal(inserted.insertedToTarget.targetHandle, 'node-open-input-1');
});

test('commitDraft writes once on matching revisions, registers triggers, and removes drafts', async () => {
  const registered = [];
  const { manager, storage } = createManager(minimalWorkflow(), {
    ids: ['draft-1', 'node-added'],
    now: 2000,
    registerWorkflowTrigger: async (...args) => {
      registered.push(args);
    },
  });
  await manager.beginDraft('minimal');
  await manager.addBlock('draft-1', 'delay', {
    alias: 'wait',
    params: {
      time: 1000,
    },
    sourceRef: 'open',
  });
  manager.connectBlocks('draft-1', 'open', 'wait');
  const result = await manager.commitDraft('draft-1');

  assert.equal(result.workflow.updatedAt, 2000);
  assert.equal(result.revision, 'updatedAt:2000');
  assert.equal(storage.store.workflows.minimal.drawflow.nodes.length, 3);
  assert.equal(
    storage.store.workflows.minimal.settings.agentBridge.aliases['node-added'],
    'wait'
  );
  assert.equal(registered.length, 1);
  assert.equal(registered[0][0], 'minimal');
  assert.equal(registered[0][1].id, 'trigger');
  assert.throws(() => manager.getDraftState('draft-1'), /draft_not_found/);
});

test('commitDraft rejects optimistic concurrency conflicts without partial persistence', async () => {
  const { manager, storage } = createManager(minimalWorkflow(), {
    ids: ['draft-1', 'node-added'],
  });
  await manager.beginDraft('minimal');
  await manager.addBlock('draft-1', 'delay', {
    alias: 'wait',
    params: {
      time: 1000,
    },
  });

  storage.store.workflows.minimal.updatedAt = 1001;

  await assert.rejects(manager.commitDraft('draft-1'), {
    code: 'workflow_conflict',
  });
  assert.equal(storage.store.workflows.minimal.drawflow.nodes.length, 2);
  assert.equal(storage.store.workflows.minimal.settings.agentBridge, undefined);
});

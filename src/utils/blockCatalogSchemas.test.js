/* eslint-env node */

const assert = require('node:assert/strict');
const test = require('node:test');

const { loadSourceModule } = require('./testBabelLoader');

const { getSchema, inferPrimitiveType, listSchemas, toBlockSchema } =
  loadSourceModule('./blockCatalogSchemas', __filename);

test('lists representative built-in schemas with metadata and connection shapes', () => {
  const schemas = listSchemas();
  const byType = Object.fromEntries(
    schemas.map((schema) => [schema.type, schema])
  );

  ['trigger', 'new-tab', 'conditions', 'ai-workflow'].forEach((type) => {
    assert.equal(byType[type].kind, 'block');
    assert.equal(byType[type].unsafe, false);
    assert.equal(byType[type].source, 'builtin');
  });

  assert.equal(byType.trigger.name, 'Trigger');
  assert.equal(byType.trigger.category, 'general');
  assert.equal(byType.trigger.component, 'BlockBasic');
  assert.deepEqual(byType.trigger.inputs, {
    count: 0,
    handles: [],
    kind: 'count',
    raw: 0,
  });
  assert.equal(byType.trigger.outputs.count, 1);

  assert.equal(byType['new-tab'].category, 'browser');
  assert.equal(byType['new-tab'].component, 'BlockBasic');
  assert.equal(byType['new-tab'].inputs.count, 1);
  assert.equal(byType['new-tab'].outputs.count, 1);

  assert.equal(byType.conditions.category, 'conditions');
  assert.equal(byType.conditions.component, 'BlockConditions');
  assert.equal(byType.conditions.outputs.count, 0);

  assert.equal(byType['ai-workflow'].name, 'AI Workflow');
  assert.equal(byType['ai-workflow'].category, 'general');
  assert.equal(byType['ai-workflow'].inputs.count, 1);
  assert.equal(byType['ai-workflow'].outputs.count, 1);
});

test('extracts defaults and infers primitive parameter types without coercion', () => {
  const newTab = getSchema('new-tab');
  const newTabParams = Object.fromEntries(
    newTab.parameters.map((parameter) => [parameter.name, parameter])
  );

  assert.deepEqual(newTab.data, {
    active: true,
    customUserAgent: false,
    description: '',
    disableBlock: false,
    inGroup: false,
    tabZoom: 1,
    updatePrevTab: false,
    url: '',
    userAgent: '',
    waitTabLoaded: false,
  });
  assert.equal(newTabParams.url.type, 'string');
  assert.equal(newTabParams.active.type, 'boolean');
  assert.equal(newTabParams.tabZoom.type, 'number');
  assert.equal(newTabParams.url.default, '');

  const trigger = getSchema('trigger');
  const triggerParams = Object.fromEntries(
    trigger.parameters.map((parameter) => [parameter.name, parameter])
  );
  assert.equal(triggerParams.parameters.type, 'array');
  assert.deepEqual(triggerParams.parameters.items, { type: 'unknown' });
  assert.equal(triggerParams.observeElement.type, 'object');
  assert.equal(
    triggerParams.observeElement.fields
      .find((field) => field.name === 'targetOptions')
      .fields.find((field) => field.name === 'attributeFilter').type,
    'array'
  );

  const aiWorkflow = getSchema('ai-workflow');
  const aiParams = Object.fromEntries(
    aiWorkflow.parameters.map((parameter) => [parameter.name, parameter])
  );
  assert.equal(aiParams.flowUuid.type, 'string');
  assert.equal(aiParams.assignVariable.type, 'boolean');
  assert.equal(aiParams.inputs.type, 'array');
  assert.deepEqual(aiParams.outputs.default, []);

  const sample = toBlockSchema('sample', {
    allowedInputs: true,
    category: 'general',
    component: 'BlockBasic',
    data: {
      arr: [],
      bool: false,
      count: 2,
      nested: {
        value: null,
      },
      nil: null,
      text: '',
      unknown: undefined,
    },
    inputs: 1,
    maxConnection: 1,
    name: 'Sample',
    outputs: 2,
  });
  const sampleParams = Object.fromEntries(
    sample.parameters.map((parameter) => [parameter.name, parameter])
  );

  assert.equal(sampleParams.text.type, 'string');
  assert.equal(sampleParams.count.type, 'number');
  assert.equal(sampleParams.bool.type, 'boolean');
  assert.equal(sampleParams.arr.type, 'array');
  assert.equal(sampleParams.nested.type, 'object');
  assert.equal(sampleParams.nil.type, 'null');
  assert.equal(sampleParams.unknown.type, 'unknown');
  assert.equal(sampleParams.nested.fields[0].type, 'null');
  assert.equal(inferPrimitiveType(Symbol('unknown')), 'unknown');
});

test('returns cloned schema data instead of mutating the source catalog', () => {
  const firstSchema = getSchema('trigger');
  firstSchema.data.observeElement.targetOptions.childList = false;
  firstSchema.parameters.find(
    (parameter) => parameter.name === 'type'
  ).default = 'changed';

  const secondSchema = getSchema('trigger');
  assert.equal(secondSchema.data.observeElement.targetOptions.childList, true);
  assert.equal(
    secondSchema.parameters.find((parameter) => parameter.name === 'type')
      .default,
    'manual'
  );
});

test('marks unknown, unsafe custom, safe custom, and saved catalog entries', () => {
  const schemas = listSchemas({
    blocks: {
      'custom-safe': {
        allowedInputs: true,
        category: 'general',
        component: 'BlockBasic',
        data: {
          value: '',
        },
        inputs: 1,
        maxConnection: 1,
        name: 'Custom safe',
        outputs: 1,
      },
      'custom-unsafe': {
        name: 'Custom unsafe',
      },
    },
    savedBlocks: [
      {
        id: 'saved-unsafe',
        name: 'Saved unsafe',
      },
    ],
  });
  const byType = Object.fromEntries(
    schemas.map((schema) => [schema.type, schema])
  );

  assert.equal(byType['custom-safe'].kind, 'block');
  assert.equal(byType['custom-safe'].source, 'custom');
  assert.equal(byType['custom-safe'].parameters[0].type, 'string');
  assert.equal(byType['custom-unsafe'].kind, 'unsafe_custom_block');
  assert.equal(byType['custom-unsafe'].unsafe, true);
  assert.equal(byType['saved-unsafe'].kind, 'unsafe_saved_block');
  assert.equal(getSchema('missing-block').kind, 'unknown_block');
});

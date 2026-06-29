import { getBlocks } from './getSharedData';
import { tasks } from './shared';

const UNKNOWN_CONNECTION = {
  count: null,
  handles: [],
  kind: 'unknown',
  raw: null,
};

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function cloneValue(value, seen = new WeakMap()) {
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);

  if (Array.isArray(value)) {
    const clone = [];
    seen.set(value, clone);
    value.forEach((item) => {
      clone.push(cloneValue(item, seen));
    });

    return clone;
  }

  if (!isPlainObject(value)) return value;

  const clone = {};
  seen.set(value, clone);
  Object.entries(value).forEach(([key, item]) => {
    clone[key] = cloneValue(item, seen);
  });

  return clone;
}

export function inferPrimitiveType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (isPlainObject(value)) return 'object';

  if (['string', 'number', 'boolean'].includes(typeof value)) {
    return typeof value;
  }

  return 'unknown';
}

function inferArrayItems(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return {
      type: 'unknown',
    };
  }

  const firstType = inferPrimitiveType(value[0]);
  const sameType = value.every(
    (item) => inferPrimitiveType(item) === firstType
  );

  return {
    type: sameType ? firstType : 'unknown',
  };
}

export function toParameterDescriptor(
  name,
  defaultValue,
  path = `data.${name}`
) {
  const type = inferPrimitiveType(defaultValue);
  const descriptor = {
    default: cloneValue(defaultValue),
    name,
    optional: true,
    path,
    required: false,
    type,
  };

  if (type === 'array') {
    descriptor.items = inferArrayItems(defaultValue);
  } else if (type === 'object') {
    descriptor.fields = Object.entries(defaultValue).map(([key, value]) =>
      toParameterDescriptor(key, value, `${path}.${key}`)
    );
  }

  return descriptor;
}

export function toConnectionShape(value) {
  if (typeof value === 'number') {
    return {
      count: value,
      handles: [],
      kind: 'count',
      raw: value,
    };
  }

  if (Array.isArray(value)) {
    return {
      count: value.length,
      handles: cloneValue(value),
      kind: 'handles',
      raw: cloneValue(value),
    };
  }

  return {
    ...UNKNOWN_CONNECTION,
    raw: cloneValue(value),
  };
}

function hasSchemaMetadata(block) {
  if (!isPlainObject(block)) return false;

  return (
    typeof block.component === 'string' &&
    typeof block.category === 'string' &&
    Object.prototype.hasOwnProperty.call(block, 'data') &&
    Object.prototype.hasOwnProperty.call(block, 'inputs') &&
    Object.prototype.hasOwnProperty.call(block, 'outputs') &&
    Object.prototype.hasOwnProperty.call(block, 'maxConnection') &&
    Object.prototype.hasOwnProperty.call(block, 'allowedInputs')
  );
}

function normalizeBlockData(data) {
  return isPlainObject(data) ? cloneValue(data) : {};
}

function getSavedBlockType(savedBlock, index) {
  if (typeof savedBlock?.id === 'string' && savedBlock.id.trim()) {
    return savedBlock.id;
  }
  if (typeof savedBlock?.label === 'string' && savedBlock.label.trim()) {
    return savedBlock.label;
  }
  if (typeof savedBlock?.type === 'string' && savedBlock.type.trim()) {
    return savedBlock.type;
  }
  if (typeof savedBlock?.name === 'string' && savedBlock.name.trim()) {
    return savedBlock.name;
  }

  return `saved-block-${index}`;
}

function savedBlocksToCatalog(savedBlocks = []) {
  if (!Array.isArray(savedBlocks)) return [];

  return savedBlocks.map((savedBlock, index) => {
    const type = getSavedBlockType(savedBlock, index);

    return [
      type,
      {
        allowedInputs: savedBlock.allowedInputs,
        category: savedBlock.category || 'package',
        component: savedBlock.component,
        data: savedBlock.data,
        description: savedBlock.description || '',
        inputs: savedBlock.inputs,
        maxConnection: savedBlock.maxConnection,
        name: savedBlock.name || type,
        outputs: savedBlock.outputs,
      },
    ];
  });
}

function getCatalogEntries(options = {}) {
  const blocks = options.blocks || getBlocks();
  const entries = Object.entries(blocks).map(([type, block]) => [
    type,
    block,
    tasks[type] ? 'builtin' : 'custom',
  ]);

  savedBlocksToCatalog(options.savedBlocks).forEach(([type, block]) => {
    if (!blocks[type]) entries.push([type, block, 'saved']);
  });

  return entries;
}

function getUnsafeKind(source) {
  if (source === 'saved') return 'unsafe_saved_block';
  if (source === 'custom') return 'unsafe_custom_block';

  return 'unsafe_block';
}

export function toBlockSchema(type, block = {}, options = {}) {
  const source = options.source || (tasks[type] ? 'builtin' : 'custom');
  const hasMetadata = hasSchemaMetadata(block);
  const data = normalizeBlockData(block.data);
  const unsafe = !hasMetadata;

  return {
    alias: type,
    allowedInputs:
      block.allowedInputs === undefined
        ? null
        : cloneValue(block.allowedInputs),
    category: block.category || null,
    component: block.component || null,
    data,
    description: block.description || '',
    editComponent: block.editComponent || null,
    icon: block.icon || null,
    inputs: toConnectionShape(block.inputs),
    kind: unsafe ? getUnsafeKind(source) : 'block',
    maxConnection:
      block.maxConnection === undefined
        ? null
        : cloneValue(block.maxConnection),
    name: block.name || type,
    outputs: toConnectionShape(block.outputs),
    parameters: Object.entries(data).map(([key, value]) =>
      toParameterDescriptor(key, value)
    ),
    source,
    tag: block.tag || null,
    type,
    unsafe,
  };
}

export function unknownBlockSchema(type) {
  return {
    alias: type,
    allowedInputs: null,
    category: null,
    component: null,
    data: {},
    description: '',
    editComponent: null,
    icon: null,
    inputs: cloneValue(UNKNOWN_CONNECTION),
    kind: 'unknown_block',
    maxConnection: null,
    name: type,
    outputs: cloneValue(UNKNOWN_CONNECTION),
    parameters: [],
    source: 'unknown',
    tag: null,
    type,
    unsafe: true,
  };
}

export function listSchemas(options = {}) {
  return getCatalogEntries(options).map(([type, block, source]) =>
    toBlockSchema(type, block, { source })
  );
}

export function getSchema(type, options = {}) {
  const schema = listSchemas(options).find((item) => item.type === type);

  return schema || unknownBlockSchema(type);
}

export default {
  getSchema,
  inferPrimitiveType,
  listSchemas,
  toBlockSchema,
  toConnectionShape,
  toParameterDescriptor,
  unknownBlockSchema,
};

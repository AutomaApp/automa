export const WORKFLOW_OUTLINE_KIND = 'workflow_outline';

export function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

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

export function stableNormalize(value) {
  if (Array.isArray(value)) return value.map((item) => stableNormalize(item));
  if (!isPlainObject(value)) return value;

  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      const item = value[key];
      if (item !== undefined) acc[key] = stableNormalize(item);

      return acc;
    }, {});
}

export function stableStringify(value) {
  return JSON.stringify(stableNormalize(value));
}

export function stableHash(value) {
  const text = stableStringify(value);
  let hash = 5381;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 33 + text.charCodeAt(index)) % 2147483647;
  }

  return hash.toString(16).padStart(8, '0');
}

export function revision(workflow = {}) {
  if (
    workflow &&
    Object.prototype.hasOwnProperty.call(workflow, 'updatedAt') &&
    workflow.updatedAt !== null &&
    workflow.updatedAt !== undefined &&
    workflow.updatedAt !== ''
  ) {
    return `updatedAt:${workflow.updatedAt}`;
  }

  return `hash:${stableHash(workflow || {})}`;
}

export function parseJson(value, fallback = {}) {
  if (typeof value !== 'string') return value || fallback;

  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

export function normalizePosition(position) {
  if (!isPlainObject(position)) {
    return {
      x: 0,
      y: 0,
    };
  }

  return {
    x: Number.isFinite(position.x) ? position.x : 0,
    y: Number.isFinite(position.y) ? position.y : 0,
  };
}

export function omitKeys(value, keys) {
  const keySet = new Set(keys);

  return Object.entries(value || {}).reduce((acc, [key, item]) => {
    if (!keySet.has(key)) acc[key] = cloneValue(item);

    return acc;
  }, {});
}

export function makeWorkflowModelError(code, details = {}) {
  const error = new Error(code);
  error.code = code;
  Object.assign(error, details);

  return error;
}

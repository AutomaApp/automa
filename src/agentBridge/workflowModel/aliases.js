import { cloneValue, isPlainObject } from './common';

function normalizeAlias(alias) {
  if (typeof alias !== 'string') return null;

  const trimmed = alias.trim();
  return trimmed || null;
}

function getSettings(value = {}) {
  if (value?.settings && isPlainObject(value.settings)) return value.settings;
  if (isPlainObject(value)) return value;

  return {};
}

export function getAliases(value = {}) {
  const settings = getSettings(value);
  const aliases = settings.agentBridge?.aliases;

  if (!isPlainObject(aliases)) return {};

  return Object.entries(aliases).reduce((acc, [nodeId, alias]) => {
    const normalized = normalizeAlias(alias);
    if (normalized) acc[nodeId] = normalized;

    return acc;
  }, {});
}

export function writeAliases(settings = {}, aliases = {}) {
  const nextSettings = cloneValue(isPlainObject(settings) ? settings : {});
  const normalizedAliases = getAliases({
    settings: {
      agentBridge: {
        aliases,
      },
    },
  });

  nextSettings.agentBridge = {
    ...(isPlainObject(nextSettings.agentBridge)
      ? nextSettings.agentBridge
      : {}),
    aliases: normalizedAliases,
  };

  return nextSettings;
}

export function setAlias(settings, nodeId, alias) {
  const aliases = getAliases({ settings });
  const normalized = normalizeAlias(alias);

  if (normalized) aliases[nodeId] = normalized;
  else delete aliases[nodeId];

  return writeAliases(settings, aliases);
}

export function deleteAlias(settings, nodeId) {
  return setAlias(settings, nodeId, null);
}

export function aliasesFromBlocks(blocks = []) {
  return blocks.reduce((acc, block) => {
    const alias = normalizeAlias(block.alias);
    if (block.id && alias) acc[block.id] = alias;

    return acc;
  }, {});
}

export function validateAliases(aliases = {}, options = {}) {
  const errors = [];
  const seen = new Map();

  Object.entries(
    getAliases({
      settings: {
        agentBridge: {
          aliases,
        },
      },
    })
  ).forEach(([nodeId, alias]) => {
    if (seen.has(alias)) {
      errors.push({
        alias,
        code: 'duplicate_alias',
        nodeId,
        otherNodeId: seen.get(alias),
        severity: options.strict === false ? 'warning' : 'error',
      });
    } else {
      seen.set(alias, nodeId);
    }
  });

  return {
    errors: options.strict === false ? [] : errors,
    warnings: options.strict === false ? errors : [],
  };
}

export function resolveBlockReference(outline, reference) {
  if (!outline || reference === null || reference === undefined) return null;

  if (typeof reference === 'object' && reference.id) {
    return outline.blocks.find((block) => block.id === reference.id) || null;
  }

  const ref = String(reference);
  const byId = outline.blocks.find((block) => block.id === ref);
  if (byId) return byId;

  return outline.blocks.find((block) => block.alias === ref) || null;
}

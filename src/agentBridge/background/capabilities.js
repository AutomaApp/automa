/* eslint-env browser, node, webextensions */
/* global globalThis */

const {
  AgentBridgeError,
  isPlainObject,
  makeError,
  toJsonSafe,
} = require('./errors');

const TRUSTED_CONFIG_KEY = 'agentBridgeTrustedConfig';
const DEFAULT_SESSION_TTL_MS = 15 * 60 * 1000;
const activeSessions = new Map();
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

function createId(prefix) {
  const randomId =
    rootScope.crypto && typeof rootScope.crypto.randomUUID === 'function'
      ? rootScope.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}_${randomId}`;
}

function getStorage(options = {}) {
  if (options.storage) return options.storage;
  if (options.browser?.storage?.local) return options.browser.storage.local;
  if (rootScope.browser?.storage?.local) return rootScope.browser.storage.local;
  if (rootScope.chrome?.storage?.local) return rootScope.chrome.storage.local;
  return null;
}

async function storageGet(storage, key) {
  if (!storage) return {};

  try {
    return (await storage.get(key)) || {};
  } catch (error) {
    throw new AgentBridgeError('storage_error', undefined, {
      reason: error?.message || 'storage_get_failed',
    });
  }
}

async function storageSet(storage, value) {
  if (!storage) return;

  try {
    await storage.set(value);
  } catch (error) {
    throw new AgentBridgeError('storage_error', undefined, {
      reason: error?.message || 'storage_set_failed',
    });
  }
}

async function storageRemove(storage, key) {
  if (!storage || typeof storage.remove !== 'function') return;

  try {
    await storage.remove(key);
  } catch (error) {
    throw new AgentBridgeError('storage_error', undefined, {
      reason: error?.message || 'storage_remove_failed',
    });
  }
}

function normalizeCapabilities(capabilities) {
  let list = [];

  if (Array.isArray(capabilities)) {
    list = capabilities;
  } else if (typeof capabilities === 'string') {
    list = [capabilities];
  }

  return [
    ...new Set(
      list
        .filter(
          (capability) => typeof capability === 'string' && capability.trim()
        )
        .map((capability) => capability.trim())
    ),
  ].sort();
}

function normalizeTrustedConfig(config = {}, options = {}) {
  const safeConfig = isPlainObject(config) ? config : {};

  return {
    allowedCapabilities: normalizeCapabilities(safeConfig.allowedCapabilities),
    setupToken:
      typeof safeConfig.setupToken === 'string' && safeConfig.setupToken
        ? safeConfig.setupToken
        : null,
    tokenConsumedAt:
      typeof safeConfig.tokenConsumedAt === 'number'
        ? safeConfig.tokenConsumedAt
        : null,
    trustedClients: Array.isArray(safeConfig.trustedClients)
      ? toJsonSafe(safeConfig.trustedClients, [])
      : [],
    trustedOrigins: Array.isArray(safeConfig.trustedOrigins)
      ? toJsonSafe(safeConfig.trustedOrigins, [])
      : [],
    updatedAt:
      typeof safeConfig.updatedAt === 'number'
        ? safeConfig.updatedAt
        : options.updatedAt || null,
    verboseAudit: safeConfig.verboseAudit === true,
  };
}

async function loadTrustedConfig(options = {}) {
  const storage = getStorage(options);
  const result = await storageGet(storage, TRUSTED_CONFIG_KEY);

  return normalizeTrustedConfig(result[TRUSTED_CONFIG_KEY]);
}

async function saveTrustedConfig(config, options = {}) {
  const storage = getStorage(options);
  const trustedConfig = normalizeTrustedConfig(config, {
    updatedAt: nowMs(options),
  });

  trustedConfig.updatedAt = nowMs(options);

  await storageSet(storage, { [TRUSTED_CONFIG_KEY]: trustedConfig });

  return trustedConfig;
}

async function clearTrustedConfig(options = {}) {
  const storage = getStorage(options);
  await storageRemove(storage, TRUSTED_CONFIG_KEY);
}

async function setSetupToken(setupToken, options = {}) {
  const config = await loadTrustedConfig(options);

  return saveTrustedConfig(
    {
      ...config,
      setupToken,
      tokenConsumedAt: null,
    },
    options
  );
}

function createTrustedSession(
  {
    capabilities = [],
    clientId = null,
    origin = null,
    sessionId = null,
    ttlMs = DEFAULT_SESSION_TTL_MS,
  } = {},
  options = {}
) {
  const createdAt = nowMs(options);
  const grantedCapabilities = normalizeCapabilities(capabilities);
  const trustedSession = {
    clientId:
      typeof clientId === 'string' && clientId.trim() ? clientId.trim() : null,
    createdAt,
    expiresAt: createdAt + ttlMs,
    grantedCapabilities,
    lastUsedAt: createdAt,
    origin: typeof origin === 'string' && origin.trim() ? origin.trim() : null,
    sessionId:
      typeof sessionId === 'string' && sessionId.trim()
        ? sessionId.trim()
        : createId('agt_sess'),
  };

  activeSessions.set(trustedSession.sessionId, trustedSession);

  return trustedSession;
}

function clearTrustedSession(sessionId) {
  return activeSessions.delete(sessionId);
}

function clearAllTrustedSessions() {
  activeSessions.clear();
}

function getTrustedSession(sessionId) {
  return activeSessions.get(sessionId) || null;
}

function validateTrustedSession(sessionId, options = {}) {
  if (typeof sessionId !== 'string' || !sessionId.trim()) {
    return {
      error: makeError('missing_trusted_session'),
      ok: false,
    };
  }

  const trustedSession = activeSessions.get(sessionId);

  if (!trustedSession) {
    return {
      error: makeError('invalid_trusted_session', { sessionId }),
      ok: false,
    };
  }

  const currentTime = nowMs(options);
  if (trustedSession.expiresAt <= currentTime) {
    activeSessions.delete(sessionId);

    return {
      error: makeError('expired_trusted_session', { sessionId }),
      ok: false,
    };
  }

  trustedSession.lastUsedAt = currentTime;

  return {
    ok: true,
    session: trustedSession,
  };
}

function checkRequiredCapabilities(
  requiredCapabilities,
  envelope = {},
  options = {}
) {
  const required = normalizeCapabilities(requiredCapabilities);
  if (required.length === 0) {
    return {
      grantedCapabilities: [],
      ok: true,
      requiredCapabilities: required,
      session: null,
    };
  }

  const sessionCheck = validateTrustedSession(envelope.sessionId, options);
  if (!sessionCheck.ok) {
    return {
      ...sessionCheck,
      requiredCapabilities: required,
    };
  }

  const granted = new Set(sessionCheck.session.grantedCapabilities);
  const missingCapability = required.find(
    (capability) => !granted.has(capability)
  );

  if (missingCapability) {
    return {
      error: makeError('missing_capability', {
        capability: missingCapability,
      }),
      ok: false,
      requiredCapabilities: required,
      session: sessionCheck.session,
    };
  }

  return {
    grantedCapabilities: sessionCheck.session.grantedCapabilities,
    ok: true,
    requiredCapabilities: required,
    session: sessionCheck.session,
  };
}

async function createTrustedSessionFromToken(
  {
    capabilities = [],
    clientId = null,
    origin = null,
    setupToken = null,
    ttlMs = DEFAULT_SESSION_TTL_MS,
  } = {},
  options = {}
) {
  const config = await loadTrustedConfig(options);

  if (!config.setupToken) {
    return {
      error: makeError('setup_token_missing'),
      ok: false,
    };
  }

  if (typeof setupToken !== 'string' || setupToken !== config.setupToken) {
    return {
      error: makeError('setup_token_invalid'),
      ok: false,
    };
  }

  const requestedCapabilities = normalizeCapabilities(capabilities);
  const grantedCapabilities =
    requestedCapabilities.length > 0
      ? requestedCapabilities
      : config.allowedCapabilities;
  const allowed = new Set(config.allowedCapabilities);
  const missingCapability = grantedCapabilities.find(
    (capability) => !allowed.has(capability)
  );

  if (missingCapability) {
    return {
      error: makeError('missing_capability', {
        capability: missingCapability,
      }),
      ok: false,
    };
  }

  const savedConfig = await saveTrustedConfig(
    {
      ...config,
      setupToken: null,
      tokenConsumedAt: nowMs(options),
    },
    options
  );
  const session = createTrustedSession(
    {
      capabilities: grantedCapabilities,
      clientId,
      origin,
      ttlMs,
    },
    options
  );

  return {
    config: savedConfig,
    ok: true,
    session,
  };
}

const exported = {
  DEFAULT_SESSION_TTL_MS,
  TRUSTED_CONFIG_KEY,
  checkRequiredCapabilities,
  clearAllTrustedSessions,
  clearTrustedConfig,
  clearTrustedSession,
  createTrustedSession,
  createTrustedSessionFromToken,
  getTrustedSession,
  loadTrustedConfig,
  normalizeCapabilities,
  normalizeTrustedConfig,
  saveTrustedConfig,
  setSetupToken,
  validateTrustedSession,
};

module.exports = exported;
module.exports.default = exported;

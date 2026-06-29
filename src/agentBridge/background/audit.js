/* eslint-env browser, node, webextensions */
/* eslint-disable no-use-before-define */
/* global globalThis */

const { isPlainObject, normalizeError, toJsonSafe } = require('./errors');

const AUDIT_LOG_KEY = 'agentBridgeAuditLog';
const MAX_AUDIT_EVENTS = 200;
const MAX_DEFAULT_STRING_LENGTH = 160;
const MAX_VERBOSE_STRING_LENGTH = 800;
const MAX_KEYS = 20;
const MAX_ARRAY_ITEMS = 5;
const MAX_DEPTH = 4;
const inMemoryAuditLog = [];

const SENSITIVE_KEY_RE =
  /cookie|authorization|bearer|token|secret|password|passwd|api[-_]?key|credential|session|provider_token|provider_refresh_token/i;
const FILE_KEY_RE =
  /file|files|filepaths|file_paths|upload|uploads|blob|dataurl|data_url|base64|attachment|attachments/i;
const RAW_PAGE_KEY_RE =
  /html|dom|document|pagesource|page_source|rawpage|raw_page|rawdata|raw_data|innerhtml|outerhtml|innertext|outertext|screenshot|snapshot/i;
const TABLE_LOG_KEY_RE = /table|tables|rows|records|log|logs|trace|traces/i;
const SECRET_VALUE_RE =
  /^(bearer|basic)\s+[a-z0-9._~+/=-]+$|sk-[a-z0-9]{12,}|xox[baprs]-|gh[pousr]_[a-z0-9_]+/i;
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

function createAuditId() {
  const randomId =
    rootScope.crypto && typeof rootScope.crypto.randomUUID === 'function'
      ? rootScope.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `aud_${randomId}`;
}

function getStorage(options = {}) {
  if (options.storage) return options.storage;
  if (options.browser?.storage?.local) return options.browser.storage.local;
  if (rootScope.browser?.storage?.local) return rootScope.browser.storage.local;
  if (rootScope.chrome?.storage?.local) return rootScope.chrome.storage.local;
  return null;
}

function estimateSize(value) {
  if (typeof value === 'string') return value.length;
  if (Array.isArray(value)) return value.length;
  if (isPlainObject(value)) return Object.keys(value).length;
  if (value === null || value === undefined) return 0;

  return String(value).length;
}

function redacted(reason, value) {
  return {
    reason,
    redacted: true,
    size: estimateSize(value),
    type: Array.isArray(value) ? 'array' : typeof value,
  };
}

function valueType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function summarizeString(value, options) {
  if (SECRET_VALUE_RE.test(value)) return redacted('secret_value', value);

  const maxLength = options.verbose
    ? MAX_VERBOSE_STRING_LENGTH
    : MAX_DEFAULT_STRING_LENGTH;

  if (value.length > maxLength) {
    return {
      length: value.length,
      reason: 'large_value',
      redacted: true,
      type: 'string',
    };
  }

  if (options.verbose) return value;

  return {
    length: value.length,
    type: 'string',
  };
}

function summarizeArray(value, key, options, depth, seen) {
  if (TABLE_LOG_KEY_RE.test(key) || value.length > MAX_ARRAY_ITEMS) {
    return {
      length: value.length,
      reason: TABLE_LOG_KEY_RE.test(key) ? 'table_or_log' : 'large_array',
      redacted: true,
      type: 'array',
    };
  }

  return {
    items: value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => summarizeValue(item, '', options, depth + 1, seen)),
    length: value.length,
    type: 'array',
  };
}

function summarizeObject(value, options, depth, seen) {
  if (seen.has(value)) {
    return {
      circular: true,
      type: 'object',
    };
  }
  seen.add(value);

  const keys = Object.keys(value).slice(0, MAX_KEYS);
  const summary = {
    keys,
    type: 'object',
    values: {},
  };

  keys.forEach((key) => {
    summary.values[key] = summarizeValue(
      value[key],
      key,
      options,
      depth + 1,
      seen
    );
  });

  if (Object.keys(value).length > keys.length) {
    summary.truncatedKeys = Object.keys(value).length - keys.length;
  }

  return summary;
}

function summarizeValue(
  value,
  key = '',
  options = {},
  depth = 0,
  seen = new WeakSet()
) {
  const normalizedKey = String(key).toLowerCase();

  if (SENSITIVE_KEY_RE.test(normalizedKey))
    return redacted('sensitive_key', value);
  if (FILE_KEY_RE.test(normalizedKey)) return redacted('file_reference', value);
  if (RAW_PAGE_KEY_RE.test(normalizedKey))
    return redacted('raw_page_data', value);

  if (depth >= MAX_DEPTH) {
    return {
      reason: 'max_depth',
      redacted: true,
      type: valueType(value),
    };
  }

  if (typeof value === 'string') return summarizeString(value, options);
  if (
    value === null ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'function' || typeof value === 'symbol') {
    return {
      redacted: true,
      type: typeof value,
    };
  }
  if (Array.isArray(value))
    return summarizeArray(value, normalizedKey, options, depth, seen);
  if (isPlainObject(value)) return summarizeObject(value, options, depth, seen);

  return {
    type: valueType(value),
  };
}

function summarizePayload(payload = {}, options = {}) {
  return summarizeValue(payload, 'payload', {
    verbose: options.verbose === true,
  });
}

async function appendAuditEvent(event, options = {}) {
  const storage = getStorage(options);

  if (!storage) {
    inMemoryAuditLog.push(event);
    if (inMemoryAuditLog.length > MAX_AUDIT_EVENTS) inMemoryAuditLog.shift();
    return;
  }

  try {
    const result = (await storage.get(AUDIT_LOG_KEY)) || {};
    const currentEvents = Array.isArray(result[AUDIT_LOG_KEY])
      ? result[AUDIT_LOG_KEY]
      : [];
    const nextEvents = currentEvents.concat(event).slice(-MAX_AUDIT_EVENTS);

    await storage.set({ [AUDIT_LOG_KEY]: nextEvents });
  } catch (_error) {
    inMemoryAuditLog.push(event);
    if (inMemoryAuditLog.length > MAX_AUDIT_EVENTS) inMemoryAuditLog.shift();
  }
}

async function recordAuditEvent(
  {
    command = null,
    envelope = {},
    errors = [],
    requiredCapabilities = [],
    status = 'success',
  } = {},
  options = {}
) {
  const normalizedErrors = (Array.isArray(errors) ? errors : [errors])
    .filter(Boolean)
    .map((error) => normalizeError(error));
  const verbose =
    options.config?.verboseAudit === true || options.verbose === true;
  const auditId = createAuditId();
  const event = toJsonSafe(
    {
      auditId,
      command: command || envelope?.command || null,
      envelopeId: envelope?.id || null,
      errors: normalizedErrors,
      payloadSummary: summarizePayload(envelope?.payload || {}, { verbose }),
      requiredCapabilities,
      sessionId: envelope?.sessionId || null,
      status,
      timestamp: nowMs(options),
    },
    {
      auditId,
      command: null,
      envelopeId: null,
      errors: [],
      payloadSummary: summarizePayload({}),
      requiredCapabilities: [],
      sessionId: null,
      status: 'audit_fallback',
      timestamp: nowMs(options),
    }
  );

  await appendAuditEvent(event, options);

  return {
    auditId,
    event,
  };
}

function getInMemoryAuditLog() {
  return inMemoryAuditLog.slice();
}

function clearInMemoryAuditLog() {
  inMemoryAuditLog.length = 0;
}

const exported = {
  AUDIT_LOG_KEY,
  clearInMemoryAuditLog,
  createAuditId,
  getInMemoryAuditLog,
  recordAuditEvent,
  summarizePayload,
};

module.exports = exported;
module.exports.default = exported;

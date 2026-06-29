/* eslint-env browser, node, webextensions */

const ERROR_MESSAGES = {
  expired_trusted_session: 'Trusted session expired',
  handler_error: 'Command handler failed',
  invalid_envelope: 'Command envelope must be a plain object',
  invalid_field: 'Command envelope field is invalid',
  log_not_found: 'Workflow log not found',
  invalid_trusted_session: 'Trusted session is not active',
  missing_capability: 'Trusted session is missing a required capability',
  missing_field: 'Command envelope is missing a required field',
  missing_trusted_session: 'Command requires a trusted session',
  runtime_unavailable: 'Workflow runtime is unavailable',
  setup_token_invalid: 'Setup token is invalid',
  setup_token_missing: 'Setup token is not configured',
  storage_error: 'Trusted configuration could not be read',
  unknown_command: 'Unknown agent command',
  validation_error: 'Command payload is invalid',
  workflow_not_found: 'Workflow not found',
};

class AgentBridgeError extends Error {
  constructor(code, message, details = {}) {
    super(message || ERROR_MESSAGES[code] || ERROR_MESSAGES.handler_error);
    this.name = 'AgentBridgeError';
    this.code = code || 'handler_error';
    this.details = details;
  }
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function toJsonSafe(value, fallback = null) {
  const seen = new WeakSet();

  try {
    const json = JSON.stringify(value, (_key, currentValue) => {
      if (typeof currentValue === 'bigint') return currentValue.toString();
      if (
        typeof currentValue === 'function' ||
        typeof currentValue === 'symbol' ||
        typeof currentValue === 'undefined'
      ) {
        return undefined;
      }

      if (currentValue instanceof Error) {
        return {
          code: currentValue.code || 'handler_error',
          message: currentValue.message,
          name: currentValue.name,
        };
      }

      if (currentValue && typeof currentValue === 'object') {
        if (seen.has(currentValue)) return '[Circular]';
        seen.add(currentValue);
      }

      return currentValue;
    });

    if (typeof json === 'undefined') return fallback;

    return JSON.parse(json);
  } catch (_error) {
    return fallback;
  }
}

function makeError(code, details = {}) {
  const safeDetails = toJsonSafe(details, {});
  const message =
    safeDetails.message || ERROR_MESSAGES[code] || ERROR_MESSAGES.handler_error;
  const error = {
    code: code || 'handler_error',
    message,
  };

  [
    'capability',
    'command',
    'field',
    'logId',
    'reason',
    'sessionId',
    'workflowId',
  ].forEach((key) => {
    if (safeDetails[key] !== undefined) error[key] = safeDetails[key];
  });

  return error;
}

function normalizeError(error, fallbackCode = 'handler_error') {
  if (error instanceof AgentBridgeError) {
    return makeError(error.code, {
      ...error.details,
      message: error.message,
    });
  }

  if (isPlainObject(error) && typeof error.code === 'string') {
    return makeError(error.code, error);
  }

  return makeError(fallbackCode);
}

function normalizeWarnings(warnings) {
  if (!Array.isArray(warnings)) return [];
  return toJsonSafe(warnings, []);
}

function makeSuccessResponse({
  id = null,
  data = null,
  warnings = [],
  auditId = null,
} = {}) {
  return toJsonSafe(
    {
      auditId,
      data: toJsonSafe(data, null),
      errors: [],
      id,
      ok: true,
      warnings: normalizeWarnings(warnings),
    },
    {
      auditId: null,
      data: null,
      errors: [],
      id: null,
      ok: true,
      warnings: [],
    }
  );
}

function makeErrorResponse({
  id = null,
  errors = [],
  warnings = [],
  auditId = null,
} = {}) {
  const normalizedErrors = (Array.isArray(errors) ? errors : [errors]).map(
    (error) => normalizeError(error)
  );

  return toJsonSafe(
    {
      auditId,
      data: null,
      errors: normalizedErrors,
      id,
      ok: false,
      warnings: normalizeWarnings(warnings),
    },
    {
      auditId: null,
      data: null,
      errors: [makeError('handler_error')],
      id: null,
      ok: false,
      warnings: [],
    }
  );
}

const exported = {
  AgentBridgeError,
  ERROR_MESSAGES,
  isPlainObject,
  makeError,
  makeErrorResponse,
  makeSuccessResponse,
  normalizeError,
  toJsonSafe,
};

module.exports = exported;
module.exports.default = exported;

#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_HOST = 'localhost';
const DEFAULT_HANDSHAKE_TIMEOUT_MS = 15000;
const DEFAULT_RESPONSE_TIMEOUT_MS = 30000;
const DEFAULT_SESSION_CACHE_PATH = path.join(os.tmpdir(), 'automa-agent-session.json');
const DEFAULT_CAPABILITIES = [
  'dangerous:block',
  'extension:read',
  'extension:write',
  'external:request',
  'runtime:read',
  'workflow:run',
];
const RESPONSE_EVENT = '__automa-ext__agent-command';
const COMMAND_EVENT = '__automa-ext__';
const SENSITIVE_KEY_PATTERN =
  /(^|[-_])(access[-_]?token|api[-_]?key|authorization|cookie|password|refresh[-_]?token|secret|session[-_]?token|setup[-_]?token|token)($|[-_])/i;

const FLAG_ALIASES = {
  'client-id': 'clientId',
  'log-id': 'logId',
  'source-handle': 'sourceHandle',
  'target-handle': 'targetHandle',
};
const BOOLEAN_FLAGS = new Set(['help', 'trusted']);
const VALUE_FLAGS = new Set([
  'alias',
  'capabilities',
  'capability',
  'client-id',
  'cursor',
  'format',
  'handle',
  'id',
  'limit',
  'log-id',
  'name',
  'origin',
  'param',
  'port',
  'query',
  'session',
  'source',
  'source-handle',
  'target-handle',
  'timeout',
  'token',
  'ttl',
]);
const REPEAT_FLAGS = new Set(['capabilities', 'capability', 'param']);

const HELP_TEXT = `Usage:
  automa-agent bridge start [--trusted --token <token>]
  automa-agent workflow list [--limit <n>]
  automa-agent workflow get <workflowId> [--format outline|raw]
  automa-agent workflow begin-draft <workflowId>
  automa-agent workflow add-block <draftId> <type> [--alias <alias>] [--param key=value]
  automa-agent workflow connect <draftId> <source> <target> [--handle <handle>]
  automa-agent workflow validate <draftId>
  automa-agent workflow commit <draftId>
  automa-agent workflow run <workflowId>
  automa-agent workflow logs <workflowId> [--limit <n>]
  automa-agent blocks list
  automa-agent blocks schema <type>
  automa-agent blocks search <query> [--limit <n>]

Common flags:
  --trusted --token <token>   Create a trusted session before dispatching.
  --session <sessionId>       Attach an existing trusted session id.
  --param key=value           Add a typed block/workflow parameter. Repeatable.
  --limit <n>                 Bound command payloads and printed data arrays.
`;

class CliError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'CliError';
    this.code = code;
    this.details = details;
  }
}

function cloneJson(value, fallback = null) {
  if (value === undefined) return fallback;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_error) {
    return fallback;
  }
}

function createRequestId(prefix = 'cmd') {
  return `${prefix}_${randomUUID()}`;
}

function normalizeFlagName(name) {
  return FLAG_ALIASES[name] || name;
}

function setFlag(flags, rawName, value) {
  const name = normalizeFlagName(rawName);

  if (REPEAT_FLAGS.has(rawName)) {
    const key = rawName === 'param' ? 'params' : 'capabilities';
    flags[key].push(value);
    return;
  }

  flags[name] = value;
}

function parseFlagToken(token) {
  const withoutPrefix = token.slice(2);
  const equalsIndex = withoutPrefix.indexOf('=');

  if (equalsIndex === -1) {
    return {
      hasInlineValue: false,
      name: withoutPrefix,
      value: null,
    };
  }

  return {
    hasInlineValue: true,
    name: withoutPrefix.slice(0, equalsIndex),
    value: withoutPrefix.slice(equalsIndex + 1),
  };
}

function parseFlags(tokens) {
  const flags = {
    capabilities: [],
    params: [],
  };
  const positionals = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (token === '-h') {
      flags.help = true;
      continue;
    }

    if (!token.startsWith('--') || token === '--') {
      positionals.push(token);
      continue;
    }

    const { hasInlineValue, name, value: inlineValue } = parseFlagToken(token);
    if (BOOLEAN_FLAGS.has(name)) {
      if (hasInlineValue) {
        throw new CliError('invalid_flag', `Flag --${name} does not take a value`, {
          flag: name,
        });
      }
      setFlag(flags, name, true);
      continue;
    }

    if (!VALUE_FLAGS.has(name)) {
      throw new CliError('unknown_flag', `Unknown flag --${name}`, {
        flag: name,
      });
    }

    const value = hasInlineValue ? inlineValue : tokens[index + 1];
    if (value === undefined || (!hasInlineValue && value.startsWith('--'))) {
      throw new CliError('missing_flag_value', `Flag --${name} requires a value`, {
        flag: name,
      });
    }

    if (!hasInlineValue) index += 1;
    setFlag(flags, name, value);
  }

  return {
    flags,
    positionals,
  };
}

function normalizeIntegerFlag(value, flag, { defaultValue = null, min = 0 } = {}) {
  if (value === undefined || value === null || value === '') return defaultValue;

  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue < min) {
    throw new CliError(
      'invalid_flag_value',
      `Flag --${flag} must be an integer greater than or equal to ${min}`,
      {
        flag,
        value,
      }
    );
  }

  return numberValue;
}

function validateCommonFlags(flags) {
  if (flags.format && !['outline', 'raw'].includes(flags.format)) {
    throw new CliError(
      'invalid_flag_value',
      'Flag --format must be outline or raw',
      {
        flag: 'format',
        value: flags.format,
      }
    );
  }

  flags.limit = normalizeIntegerFlag(flags.limit, 'limit');
  flags.port = normalizeIntegerFlag(flags.port, 'port');
  flags.timeout = normalizeIntegerFlag(flags.timeout, 'timeout');
  flags.ttl = normalizeIntegerFlag(flags.ttl, 'ttl');
}

export function parseArgv(argv = []) {
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
    return {
      flags: {
        capabilities: [],
        help: true,
        params: [],
      },
      group: null,
      help: true,
      positionals: [],
      subcommand: null,
    };
  }

  const [group, subcommand = null, ...rest] = argv;
  const parsed = parseFlags(rest);
  validateCommonFlags(parsed.flags);

  return {
    flags: parsed.flags,
    group,
    help: parsed.flags.help === true,
    positionals: parsed.positionals,
    subcommand,
  };
}

function coerceParamValue(value) {
  const trimmed = String(value).trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;

  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch (error) {
      throw new CliError('invalid_param', 'Parameter JSON is invalid', {
        reason: error.message,
      });
    }
  }

  if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  return value;
}

function assignParam(target, key, value) {
  const parts = key.split('.').filter(Boolean);
  if (parts.length === 0) {
    throw new CliError('invalid_param', 'Parameter key is required');
  }

  let cursor = target;
  parts.slice(0, -1).forEach((part) => {
    if (!cursor[part] || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) {
      cursor[part] = {};
    }
    cursor = cursor[part];
  });

  const finalKey = parts.at(-1);
  if (Object.prototype.hasOwnProperty.call(cursor, finalKey)) {
    cursor[finalKey] = Array.isArray(cursor[finalKey])
      ? [...cursor[finalKey], value]
      : [cursor[finalKey], value];
  } else {
    cursor[finalKey] = value;
  }
}

export function parseParams(rawParams = []) {
  const params = {};

  rawParams.forEach((rawParam) => {
    const trimmed = String(rawParam).trim();

    if (trimmed.startsWith('{')) {
      const objectValue = coerceParamValue(trimmed);
      if (!objectValue || typeof objectValue !== 'object' || Array.isArray(objectValue)) {
        throw new CliError('invalid_param', 'JSON --param must be an object');
      }
      Object.entries(objectValue).forEach(([key, value]) => {
        assignParam(params, key, cloneJson(value, value));
      });
      return;
    }

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex <= 0) {
      throw new CliError('invalid_param', '--param must use key=value');
    }

    const key = trimmed.slice(0, equalsIndex);
    const value = trimmed.slice(equalsIndex + 1);
    assignParam(params, key, coerceParamValue(value));
  });

  return params;
}

function normalizeCapabilities(values = [], fallback = DEFAULT_CAPABILITIES) {
  const parsed = values
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set(parsed.length > 0 ? parsed : fallback)].sort();
}

function makeEnvelope(command, payload, options = {}) {
  const envelope = {
    capabilities: normalizeCapabilities(
      options.capabilities || [],
      options.defaultCapabilities || []
    ),
    client: {
      id: options.clientId || 'automa-agent-cli',
      name: 'automa-agent',
    },
    command,
    id: options.idGenerator ? options.idGenerator('cmd') : createRequestId('cmd'),
    payload: cloneJson(payload, {}),
  };

  if (options.sessionId) envelope.sessionId = options.sessionId;
  return envelope;
}

function requirePositionals(spec, names) {
  if (spec.positionals.length < names.length) {
    throw new CliError(
      'missing_argument',
      `Missing argument <${names[spec.positionals.length]}>`,
      {
        argument: names[spec.positionals.length],
        command: [spec.group, spec.subcommand].filter(Boolean).join(' '),
      }
    );
  }

  return Object.fromEntries(names.map((name, index) => [name, spec.positionals[index]]));
}

function withLimitPayload(payload, flags) {
  const nextPayload = { ...payload };
  if (flags.limit !== null && flags.limit !== undefined) nextPayload.limit = flags.limit;
  if (flags.cursor !== undefined) nextPayload.cursor = flags.cursor;
  return nextPayload;
}

const WORKFLOW_COMMANDS = {
  'add-block': {
    capabilities: ['extension:write'],
    command: 'workflow.addBlock',
    payload(spec) {
      const { draftId, type } = requirePositionals(spec, ['draftId', 'type']);
      return {
        alias: spec.flags.alias || null,
        draftId,
        id: spec.flags.id || undefined,
        params: parseParams(spec.flags.params),
        sourceRef: spec.flags.source || undefined,
        type,
      };
    },
  },
  'begin-draft': {
    capabilities: ['extension:write'],
    command: 'workflow.beginDraft',
    payload(spec) {
      const { workflowId } = requirePositionals(spec, ['workflowId']);
      return { workflowId };
    },
  },
  commit: {
    capabilities: ['extension:write'],
    command: 'workflow.commitDraft',
    payload(spec) {
      const { draftId } = requirePositionals(spec, ['draftId']);
      return { draftId };
    },
  },
  connect: {
    capabilities: ['extension:write'],
    command: 'workflow.connectBlocks',
    payload(spec) {
      const { draftId, source, target } = requirePositionals(spec, [
        'draftId',
        'source',
        'target',
      ]);
      return {
        draftId,
        handle: spec.flags.handle || undefined,
        params: parseParams(spec.flags.params),
        source,
        sourceHandle: spec.flags.sourceHandle || undefined,
        target,
        targetHandle: spec.flags.targetHandle || undefined,
      };
    },
  },
  get: {
    capabilities: ['extension:read'],
    command(spec) {
      return spec.flags.format === 'raw' ? 'workflow.getRaw' : 'workflow.getOutline';
    },
    payload(spec) {
      const { workflowId } = requirePositionals(spec, ['workflowId']);
      return { id: workflowId };
    },
  },
  list: {
    capabilities: ['extension:read'],
    command: 'workflow.list',
    payload(spec) {
      return withLimitPayload({}, spec.flags);
    },
  },
  logs: {
    capabilities: ['runtime:read'],
    command: 'workflow.getLogs',
    payload(spec) {
      const { workflowId } = requirePositionals(spec, ['workflowId']);
      return withLimitPayload({ id: workflowId, logId: spec.flags.logId || undefined }, spec.flags);
    },
  },
  run: {
    capabilities: ['workflow:run'],
    command: 'workflow.run',
    payload(spec) {
      const { workflowId } = requirePositionals(spec, ['workflowId']);
      return { id: workflowId, params: parseParams(spec.flags.params) };
    },
  },
  validate: {
    capabilities: ['extension:write'],
    command: 'workflow.validate',
    payload(spec) {
      const { draftId } = requirePositionals(spec, ['draftId']);
      return { draftId };
    },
  },
};

const BLOCK_COMMANDS = {
  list: {
    capabilities: ['extension:read'],
    command: 'blocks.list',
    payload(spec) {
      return withLimitPayload({}, spec.flags);
    },
  },
  schema: {
    capabilities: ['extension:read'],
    command: 'blocks.getSchema',
    payload(spec) {
      const { type } = requirePositionals(spec, ['type']);
      return { type };
    },
  },
  search: {
    capabilities: ['extension:read'],
    command: 'blocks.search',
    payload(spec) {
      const query =
        spec.flags.query || requirePositionals(spec, ['query']).query;
      return withLimitPayload({ query }, spec.flags);
    },
  },
};

function resolveDescriptor(spec) {
  if (spec.group === 'workflow') return WORKFLOW_COMMANDS[spec.subcommand];
  if (spec.group === 'blocks') return BLOCK_COMMANDS[spec.subcommand];
  return null;
}

function makeTrustPayload(spec) {
  if (!spec.flags.token) {
    throw new CliError('missing_flag_value', '--trusted requires --token <token>', {
      flag: 'token',
    });
  }

  return {
    capabilities: normalizeCapabilities(spec.flags.capabilities, DEFAULT_CAPABILITIES),
    clientId: spec.flags.clientId || 'automa-agent-cli',
    origin: spec.flags.origin || 'automa-agent-cli',
    setupToken: spec.flags.token,
    ttlMs: spec.flags.ttl || undefined,
  };
}

function buildBridgeStartRequest(spec, options = {}) {
  if (spec.subcommand !== 'start') {
    throw new CliError('unknown_command', 'Unknown bridge command', {
      command: `bridge ${spec.subcommand || ''}`.trim(),
    });
  }

  const command = spec.flags.trusted || spec.flags.token ? 'agent.session.trust' : 'agent.ping';
  const payload = command === 'agent.session.trust' ? makeTrustPayload(spec) : {};
  const capabilities = command === 'agent.session.trust' ? [] : [];

  return {
    envelope: makeEnvelope(command, payload, {
      capabilities,
      clientId: spec.flags.clientId,
      defaultCapabilities: [],
      idGenerator: options.idGenerator,
      sessionId: spec.flags.session,
    }),
    output: {
      limit: spec.flags.limit,
      secrets: [spec.flags.token].filter(Boolean),
    },
    spec,
    trustEnvelope: null,
  };
}

function buildProtocolRequest(spec, options = {}) {
  if (spec.group === 'bridge') return buildBridgeStartRequest(spec, options);

  const descriptor = resolveDescriptor(spec);
  if (!descriptor) {
    throw new CliError('unknown_command', 'Unknown command', {
      command: [spec.group, spec.subcommand].filter(Boolean).join(' '),
    });
  }

  const command =
    typeof descriptor.command === 'function'
      ? descriptor.command(spec)
      : descriptor.command;
  const payload = descriptor.payload(spec);
  const shouldTrust = spec.flags.trusted === true || Boolean(spec.flags.token);
  const envelope = makeEnvelope(command, payload, {
    capabilities: descriptor.capabilities,
    clientId: spec.flags.clientId,
    defaultCapabilities: descriptor.capabilities,
    idGenerator: options.idGenerator,
    sessionId: spec.flags.session,
  });
  const trustEnvelope = shouldTrust
    ? makeEnvelope('agent.session.trust', makeTrustPayload(spec), {
        capabilities: [],
        clientId: spec.flags.clientId,
        defaultCapabilities: [],
        idGenerator: options.idGenerator,
      })
    : null;

  return {
    envelope,
    output: {
      limit: spec.flags.limit,
      secrets: [spec.flags.token].filter(Boolean),
    },
    spec,
    trustEnvelope,
  };
}

export function buildCommandRequest(spec, options = {}) {
  if (spec.help) {
    return {
      help: HELP_TEXT,
      spec,
    };
  }

  return buildProtocolRequest(spec, options);
}

function makeErrorResponse(error, id = null) {
  const code = error?.code || 'handler_error';
  return {
    auditId: null,
    data: null,
    errors: [
      {
        code,
        message: error?.message || 'Command failed',
        ...(error?.details || {}),
      },
    ],
    id,
    ok: false,
    warnings: [],
  };
}

function isLoopbackHost(hostHeader) {
  if (!hostHeader) return true;
  const host = hostHeader.split(':')[0].replace(/^\[/, '').replace(/\]$/, '');
  return ['localhost', '127.0.0.1', '::1'].includes(host);
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(payload));
}

function sendHtml(res, html) {
  res.writeHead(200, {
    'cache-control': 'no-store',
    'content-type': 'text/html; charset=utf-8',
  });
  res.end(html);
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) {
      throw new CliError('payload_too_large', 'Request body is too large');
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (_error) {
    throw new CliError('invalid_json', 'Request body must be valid JSON');
  }
}

function bridgePageHtml() {
  const script = `
const bridgeId = new URLSearchParams(window.location.search).get('bridgeId');
const COMMAND_EVENT = ${JSON.stringify(COMMAND_EVENT)};
const RESPONSE_EVENT = ${JSON.stringify(RESPONSE_EVENT)};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postJson(path, payload) {
  await fetch(path, {
    body: JSON.stringify({ bridgeId, ...payload }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
}

function timeoutResponse(envelope) {
  return {
    auditId: null,
    data: null,
    errors: [
      {
        code: 'bridge_disconnected',
        message: 'No extension response was received',
      },
    ],
    id: envelope.id || null,
    ok: false,
    warnings: [],
  };
}

function sendToExtension(envelope, requestId, timeoutMs) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (response) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      window.removeEventListener(RESPONSE_EVENT, onResponse);
      resolve(response);
    };
    const onResponse = (event) => {
      const detail = event.detail || {};
      if (detail.requestId !== requestId && detail.id !== envelope.id) return;
      done(detail.response || detail);
    };
    const timer = setTimeout(() => done(timeoutResponse(envelope)), timeoutMs);
    window.addEventListener(RESPONSE_EVENT, onResponse);
    window.dispatchEvent(
      new CustomEvent(COMMAND_EVENT, {
        detail: {
          data: { envelope, requestId },
          type: 'agent-command',
        },
      })
    );
  });
}

async function sendHandshake() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 30000) {
    const requestId = 'handshake_' + Date.now();
    const response = await sendToExtension(
      {
        capabilities: [],
        command: 'agent.ping',
        id: 'cmd_handshake_' + Date.now(),
        payload: {},
      },
      requestId,
      1000
    );
    const firstError = response && response.errors && response.errors[0];
    if (!firstError || firstError.code !== 'bridge_disconnected') {
      await postJson('/bridge/handshake', {
        installedVersion:
          document.body.getAttribute('data-atm-ext-installed') || null,
        response,
      });
      return;
    }
    await sleep(250);
  }

  await postJson('/bridge/handshake', {
    installedVersion: document.body.getAttribute('data-atm-ext-installed') || null,
    response: {
      auditId: null,
      data: null,
      errors: [
        {
          code: 'bridge_handshake_timeout',
          message: 'Timed out waiting for extension handshake',
        },
      ],
      id: null,
      ok: false,
      warnings: [],
    },
  });
}

async function commandLoop() {
  for (;;) {
    const response = await fetch('/bridge/commands?bridgeId=' + encodeURIComponent(bridgeId));
    const command = await response.json();
    if (command.closed) return;
    if (command.idle) continue;

    const extensionResponse = await sendToExtension(
      command.envelope,
      command.requestId,
      command.timeoutMs || 30000
    );
    await postJson('/bridge/responses', {
      id: command.envelope.id,
      requestId: command.requestId,
      response: extensionResponse,
    });
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  await postJson('/bridge/ready', {
    href: window.location.href,
    userAgent: navigator.userAgent,
  });
  await sendHandshake();
  await commandLoop();
});
`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Automa Agent Bridge</title>
</head>
<body>
  <main>Automa Agent Bridge</main>
  <script>${script}</script>
</body>
</html>`;
}

export async function createBridgeServer(options = {}) {
  const bridgeId = options.bridgeId || createRequestId('bridge');
  const host = options.host || DEFAULT_HOST;
  const port = options.port || 0;
  const commandQueue = [];
  const pollWaiters = [];
  const responseWaiters = new Map();
  let closed = false;
  let readyPayload = null;
  let handshakePayload = null;
  let resolveHandshake;
  let rejectHandshake;
  const handshakePromise = new Promise((resolve, reject) => {
    resolveHandshake = resolve;
    rejectHandshake = reject;
  });
  handshakePromise.catch(() => {});

  function flushCommandQueue() {
    while (commandQueue.length > 0 && pollWaiters.length > 0) {
      const waiter = pollWaiters.shift();
      clearTimeout(waiter.timer);
      sendJson(waiter.res, 200, commandQueue.shift());
    }
  }

  function resolveResponse(body) {
    const requestId = body.requestId || body.id;
    const waiter = responseWaiters.get(requestId);
    if (!waiter) return false;

    clearTimeout(waiter.timer);
    responseWaiters.delete(requestId);
    waiter.resolve(body.response || body);
    return true;
  }

  async function handler(req, res) {
    if (!isLoopbackHost(req.headers.host)) {
      sendJson(res, 403, { error: 'forbidden_host' });
      return;
    }

    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    try {
      if (req.method === 'GET' && ['/', '/bridge'].includes(requestUrl.pathname)) {
        sendHtml(res, bridgePageHtml());
        return;
      }

      if (req.method === 'GET' && requestUrl.pathname === '/health') {
        sendJson(res, 200, {
          bridgeId,
          closed,
          ok: true,
          ready: Boolean(readyPayload),
        });
        return;
      }

      if (req.method === 'POST' && requestUrl.pathname === '/bridge/ready') {
        readyPayload = await readJsonBody(req);
        sendJson(res, 200, { ok: true });
        flushCommandQueue();
        return;
      }

      if (req.method === 'POST' && requestUrl.pathname === '/bridge/handshake') {
        handshakePayload = await readJsonBody(req);
        resolveHandshake(handshakePayload);
        sendJson(res, 200, { ok: true });
        return;
      }

      if (req.method === 'GET' && requestUrl.pathname === '/bridge/commands') {
        if (closed) {
          sendJson(res, 200, { closed: true });
          return;
        }

        if (commandQueue.length > 0) {
          sendJson(res, 200, commandQueue.shift());
          return;
        }

        const timer = setTimeout(() => {
          const index = pollWaiters.findIndex((waiter) => waiter.res === res);
          if (index >= 0) pollWaiters.splice(index, 1);
          sendJson(res, 200, { idle: true });
        }, options.pollTimeoutMs || 25000);
        pollWaiters.push({ res, timer });
        return;
      }

      if (req.method === 'POST' && requestUrl.pathname === '/bridge/responses') {
        const body = await readJsonBody(req);
        const matched = resolveResponse(body);
        sendJson(res, matched ? 200 : 404, {
          ok: matched,
        });
        return;
      }

      sendJson(res, 404, { error: 'not_found' });
    } catch (error) {
      sendJson(res, 400, makeErrorResponse(error));
    }
  }

  const server = http.createServer(handler);
  await new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, host);
  });

  const address = server.address();
  const selectedPort = typeof address === 'object' ? address.port : port;
  const url = `http://localhost:${selectedPort}/bridge?bridgeId=${encodeURIComponent(
    bridgeId
  )}`;

  async function waitForHandshake(timeoutMs = DEFAULT_HANDSHAKE_TIMEOUT_MS) {
    if (handshakePayload) return handshakePayload;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new CliError(
            'bridge_handshake_timeout',
            'Timed out waiting for extension handshake'
          )
        );
      }, timeoutMs);

      handshakePromise.then(
        (payload) => {
          clearTimeout(timer);
          resolve(payload);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        }
      );
    });
  }

  function sendEnvelope(envelope, sendOptions = {}) {
    if (closed) {
      return Promise.reject(
        new CliError('bridge_disconnected', 'Bridge server is closed')
      );
    }

    const requestId = envelope.id || createRequestId('request');
    const timeoutMs = sendOptions.timeoutMs || DEFAULT_RESPONSE_TIMEOUT_MS;
    const promise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        responseWaiters.delete(requestId);
        reject(
          new CliError('bridge_response_timeout', 'Timed out waiting for response', {
            requestId,
          })
        );
      }, timeoutMs);
      responseWaiters.set(requestId, {
        reject,
        resolve,
        timer,
      });
    });

    commandQueue.push({
      envelope,
      requestId,
      timeoutMs,
    });
    flushCommandQueue();
    return promise;
  }

  async function close() {
    if (closed) return;
    closed = true;
    rejectHandshake(new CliError('bridge_disconnected', 'Bridge server closed'));

    pollWaiters.splice(0).forEach((waiter) => {
      clearTimeout(waiter.timer);
      sendJson(waiter.res, 200, { closed: true });
    });

    responseWaiters.forEach((waiter) => {
      clearTimeout(waiter.timer);
      waiter.reject(new CliError('bridge_disconnected', 'Bridge server closed'));
    });
    responseWaiters.clear();

    const closePromise = new Promise((resolve) => server.close(resolve));
    if (typeof server.closeIdleConnections === 'function') {
      server.closeIdleConnections();
    }
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
    await closePromise;
  }

  return {
    bridgeId,
    close,
    get readyPayload() {
      return readyPayload;
    },
    sendEnvelope,
    server,
    url,
    waitForHandshake,
  };
}

async function trySpawn(command, args) {
  return new Promise((resolve) => {
    let settled = false;
    const child = spawn(command, args, {
      detached: true,
      stdio: 'ignore',
    });
    const done = (ok) => {
      if (settled) return;
      settled = true;
      if (ok) child.unref();
      resolve(ok);
    };

    child.once('error', () => done(false));
    setTimeout(() => done(true), 150);
  });
}

export async function openChrome(url, options = {}) {
  if (typeof options.opener === 'function') {
    await options.opener(url);
    return true;
  }

  if (process.env.AUTOMA_AGENT_OPEN_COMMAND) {
    return trySpawn('sh', [
      '-c',
      `${process.env.AUTOMA_AGENT_OPEN_COMMAND} "$1"`,
      'automa-agent-open',
      url,
    ]);
  }

  if (process.platform === 'darwin') {
    return trySpawn('open', ['-a', 'Google Chrome', url]);
  }

  if (process.platform === 'win32') {
    return trySpawn('cmd', ['/c', 'start', '', url]);
  }

  const commands = [
    ['google-chrome', [url]],
    ['google-chrome-stable', [url]],
    ['chromium', [url]],
    ['chromium-browser', [url]],
    ['xdg-open', [url]],
  ];

  for (const [command, args] of commands) {
    if (await trySpawn(command, args)) return true;
  }

  return false;
}

function getSessionCachePath(options = {}) {
  if (options.sessionFile === false) return null;
  return (
    options.sessionFile ||
    process.env.AUTOMA_AGENT_SESSION_FILE ||
    DEFAULT_SESSION_CACHE_PATH
  );
}

function loadSessionCache(options = {}) {
  const sessionFile = getSessionCachePath(options);
  if (!sessionFile || !fs.existsSync(sessionFile)) return null;

  try {
    const session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    if (session.expiresAt && session.expiresAt <= Date.now()) {
      fs.rmSync(sessionFile, { force: true });
      return null;
    }
    return typeof session.sessionId === 'string' ? session : null;
  } catch (_error) {
    return null;
  }
}

function saveSessionCache(session = {}, options = {}) {
  if (typeof session.sessionId !== 'string' || !session.sessionId) return;

  const sessionFile = getSessionCachePath(options);
  if (!sessionFile) return;

  fs.mkdirSync(path.dirname(sessionFile), { recursive: true });
  fs.writeFileSync(
    sessionFile,
    JSON.stringify(
      {
        capabilities: session.capabilities || [],
        expiresAt: session.expiresAt || null,
        sessionId: session.sessionId,
        updatedAt: Date.now(),
      },
      null,
      2
    ),
    {
      mode: 0o600,
    }
  );
}

function assertHandshakeOk(payload) {
  const response = payload?.response || payload;
  if (!response?.ok) {
    const error = response?.errors?.[0];
    throw new CliError(
      error?.code || 'bridge_handshake_failed',
      error?.message || 'Extension handshake failed',
      error || {}
    );
  }
}

export async function runBridgeRequest(request, options = {}) {
  const timeoutMs =
    request.spec?.flags?.timeout || options.timeoutMs || DEFAULT_HANDSHAKE_TIMEOUT_MS;
  const bridgeFactory = options.bridgeFactory || createBridgeServer;
  const bridge = await bridgeFactory({
    host: DEFAULT_HOST,
    port: request.spec?.flags?.port || 0,
  });

  try {
    const opened = await openChrome(bridge.url, {
      opener: options.opener,
    });
    if (!opened) {
      throw new CliError('chrome_open_failed', 'Could not open Chrome');
    }

    const handshake = await bridge.waitForHandshake(timeoutMs);
    assertHandshakeOk(handshake);

    let sessionId =
      request.spec?.flags?.session || loadSessionCache(options)?.sessionId || null;
    if (request.trustEnvelope) {
      const trustResponse = await bridge.sendEnvelope(request.trustEnvelope, {
        timeoutMs: options.responseTimeoutMs || DEFAULT_RESPONSE_TIMEOUT_MS,
      });
      if (!trustResponse.ok) return trustResponse;
      sessionId = trustResponse.data?.sessionId || sessionId;
      saveSessionCache(trustResponse.data, options);
    }

    const envelope = cloneJson(request.envelope, {});
    if (sessionId && !envelope.sessionId && envelope.command !== 'agent.session.trust') {
      envelope.sessionId = sessionId;
    }

    const response = await bridge.sendEnvelope(envelope, {
      timeoutMs: options.responseTimeoutMs || DEFAULT_RESPONSE_TIMEOUT_MS,
    });
    if (response.ok && envelope.command === 'agent.session.trust') {
      saveSessionCache(response.data, options);
    }
    return response;
  } finally {
    await bridge.close();
  }
}

function limitValue(value, limit) {
  if (!Number.isInteger(limit) || limit <= 0) return value;
  if (Array.isArray(value)) return value.slice(0, limit).map((item) => limitValue(item, limit));
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, limitValue(item, limit)])
  );
}

function redactString(value, secrets = []) {
  let redacted = value;
  secrets.forEach((secret) => {
    if (!secret) return;
    redacted = redacted.split(secret).join('[REDACTED]');
  });

  return redacted
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]')
    .replace(
      /((access|refresh|setup)?_?token=)[^&\s]+/gi,
      '$1[REDACTED]'
    );
}

export function redactValue(value, options = {}) {
  const secrets = options.secrets || [];
  if (typeof value === 'string') return redactString(value, secrets);
  if (Array.isArray(value)) return value.map((item) => redactValue(item, options));
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key)
        ? '[REDACTED]'
        : redactValue(item, options),
    ])
  );
}

export function formatResponse(response, options = {}) {
  const output = {
    ...response,
    data: limitValue(response.data, options.limit),
  };

  return `${JSON.stringify(redactValue(output, options), null, 2)}\n`;
}

async function writeCliError(error, stderr, options = {}) {
  stderr.write(formatResponse(makeErrorResponse(error), options));
  return 1;
}

function extractTokenSecrets(argv = []) {
  const secrets = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token.startsWith('--token=')) {
      secrets.push(token.slice('--token='.length));
    } else if (token === '--token' && argv[index + 1]) {
      secrets.push(argv[index + 1]);
      index += 1;
    }
  }

  return secrets;
}

export async function runCli(argv = process.argv.slice(2), options = {}) {
  const stdout = options.stdout || process.stdout;
  const stderr = options.stderr || process.stderr;

  try {
    const spec = parseArgv(argv);
    const request = buildCommandRequest(spec, {
      idGenerator: options.idGenerator,
    });

    if (request.help) {
      stdout.write(`${request.help}\n`);
      return 0;
    }

    const response = await runBridgeRequest(request, options);
    const outputOptions = request.output || {};
    const stream = response.ok ? stdout : stderr;
    stream.write(formatResponse(response, outputOptions));
    return response.ok ? 0 : 1;
  } catch (error) {
    return writeCliError(error, stderr, {
      secrets: extractTokenSecrets(argv),
    });
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runCli().then((exitCode) => {
    process.exitCode = exitCode;
  });
}

export { CliError, DEFAULT_CAPABILITIES, HELP_TEXT };

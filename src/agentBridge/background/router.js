/* eslint-env browser, node, webextensions */

const audit = require('./audit');
const capabilities = require('./capabilities');
const { workflowCommands } = require('./workflowCommands');
const {
  AgentBridgeError,
  isPlainObject,
  makeError,
  makeErrorResponse,
  makeSuccessResponse,
  normalizeError,
  toJsonSafe,
} = require('./errors');

function parseAgentEnvelope(envelope) {
  if (!isPlainObject(envelope)) {
    return {
      error: makeError('invalid_envelope'),
      ok: false,
    };
  }

  if (typeof envelope.id !== 'string' || !envelope.id.trim()) {
    return {
      error: makeError('missing_field', { field: 'id' }),
      ok: false,
    };
  }

  if (typeof envelope.command !== 'string' || !envelope.command.trim()) {
    return {
      error: makeError('missing_field', { field: 'command' }),
      ok: false,
    };
  }

  if (!Object.hasOwn(envelope, 'payload')) {
    return {
      error: makeError('missing_field', { field: 'payload' }),
      ok: false,
    };
  }

  if (!isPlainObject(envelope.payload)) {
    return {
      error: makeError('invalid_field', {
        field: 'payload',
        reason: 'payload_must_be_object',
      }),
      ok: false,
    };
  }

  if (
    Object.hasOwn(envelope, 'sessionId') &&
    envelope.sessionId !== null &&
    typeof envelope.sessionId !== 'string'
  ) {
    return {
      error: makeError('invalid_field', {
        field: 'sessionId',
        reason: 'session_id_must_be_string',
      }),
      ok: false,
    };
  }

  if (
    Object.hasOwn(envelope, 'client') &&
    envelope.client !== null &&
    !isPlainObject(envelope.client)
  ) {
    return {
      error: makeError('invalid_field', {
        field: 'client',
        reason: 'client_must_be_object',
      }),
      ok: false,
    };
  }

  return {
    envelope: {
      client: envelope.client || null,
      command: envelope.command.trim(),
      id: envelope.id.trim(),
      payload: envelope.payload,
      sessionId: envelope.sessionId || null,
    },
    ok: true,
  };
}

function normalizeCommandDefinition(command, definition) {
  if (typeof definition === 'function') {
    return {
      capabilities: [],
      command,
      handler: definition,
      public: false,
    };
  }

  return {
    capabilities: capabilities.normalizeCapabilities(definition?.capabilities),
    command,
    handler: definition?.handler,
    public: definition?.public === true,
  };
}

function makeRegistry(commands = {}) {
  const registry = new Map();

  if (commands instanceof Map) {
    commands.forEach((definition, command) => {
      registry.set(command, normalizeCommandDefinition(command, definition));
    });
    return registry;
  }

  Object.entries(commands).forEach(([command, definition]) => {
    registry.set(command, normalizeCommandDefinition(command, definition));
  });

  return registry;
}

function getContextNow(context = {}) {
  if (typeof context.now === 'function') return context.now();
  if (typeof context.now === 'number') return context.now;
  return Date.now();
}

async function loadAuditConfig(context = {}) {
  if (context.config) return context.config;

  try {
    return await capabilities.loadTrustedConfig(context);
  } catch (_error) {
    return capabilities.normalizeTrustedConfig();
  }
}

async function respondWithError({
  command = null,
  context = {},
  envelope = {},
  error = makeError('handler_error'),
  id = null,
  requiredCapabilities = [],
  status = 'error',
}) {
  const normalizedError = normalizeError(error);
  const config = await loadAuditConfig(context);
  const { auditId } = await audit.recordAuditEvent(
    {
      command,
      envelope,
      errors: [normalizedError],
      requiredCapabilities,
      status,
    },
    {
      ...context,
      config,
    }
  );

  return makeErrorResponse({
    auditId,
    errors: [normalizedError],
    id,
  });
}

async function executeCommand(
  definition,
  envelope,
  context,
  requiredCapabilities
) {
  if (typeof definition.handler !== 'function') {
    throw new AgentBridgeError('unknown_command', undefined, {
      command: envelope.command,
    });
  }

  return definition.handler({
    context,
    envelope,
    requiredCapabilities,
  });
}

async function handleAgentCommandWithRegistry(
  envelopeInput,
  registry,
  context = {}
) {
  const parsed = parseAgentEnvelope(envelopeInput);

  if (!parsed.ok) {
    return respondWithError({
      context,
      envelope: isPlainObject(envelopeInput) ? envelopeInput : {},
      error: parsed.error,
      id: isPlainObject(envelopeInput) ? envelopeInput.id || null : null,
      status: 'malformed',
    });
  }

  const { envelope } = parsed;
  const definition = registry.get(envelope.command);

  if (!definition) {
    return respondWithError({
      command: envelope.command,
      context,
      envelope,
      error: makeError('unknown_command', { command: envelope.command }),
      id: envelope.id,
      status: 'unknown_command',
    });
  }

  const requiredCapabilities = definition.public
    ? []
    : capabilities.normalizeCapabilities(definition.capabilities);
  const capabilityCheck = definition.public
    ? { ok: true, requiredCapabilities: [] }
    : capabilities.checkRequiredCapabilities(
        requiredCapabilities,
        envelope,
        context
      );

  if (!capabilityCheck.ok) {
    return respondWithError({
      command: envelope.command,
      context,
      envelope,
      error: capabilityCheck.error,
      id: envelope.id,
      requiredCapabilities,
      status: 'denied',
    });
  }

  try {
    const data = await executeCommand(
      definition,
      envelope,
      context,
      requiredCapabilities
    );
    const config = await loadAuditConfig(context);
    const { auditId } = await audit.recordAuditEvent(
      {
        command: envelope.command,
        envelope,
        requiredCapabilities,
        status: 'success',
      },
      {
        ...context,
        config,
      }
    );

    return makeSuccessResponse({
      auditId,
      data: toJsonSafe(data, null),
      id: envelope.id,
    });
  } catch (error) {
    return respondWithError({
      command: envelope.command,
      context,
      envelope,
      error,
      id: envelope.id,
      requiredCapabilities,
      status: 'handler_error',
    });
  }
}

function trustedSessionPayload(envelope) {
  return {
    capabilities: envelope.payload.capabilities,
    clientId: envelope.payload.clientId || envelope.client?.id || null,
    origin: envelope.payload.origin || envelope.client?.origin || null,
    setupToken: envelope.payload.setupToken,
    ttlMs: envelope.payload.ttlMs,
  };
}

const defaultCommands = {
  'agent.echo': {
    capabilities: ['agent.echo'],
    handler: async ({ envelope }) => ({
      echo: envelope.payload,
    }),
  },
  'agent.ping': {
    handler: async ({ context, envelope }) => ({
      envelopeId: envelope.id,
      pong: true,
      timestamp: getContextNow(context),
    }),
    public: true,
  },
  'agent.session.clear': {
    capabilities: ['agent.session'],
    handler: async ({ envelope }) => ({
      cleared: capabilities.clearTrustedSession(envelope.sessionId),
    }),
  },
  'agent.session.trust': {
    handler: async ({ context, envelope }) => {
      const result = await capabilities.createTrustedSessionFromToken(
        trustedSessionPayload(envelope),
        context
      );

      if (!result.ok) {
        throw new AgentBridgeError(
          result.error.code,
          result.error.message,
          result.error
        );
      }

      return {
        capabilities: result.session.grantedCapabilities,
        expiresAt: result.session.expiresAt,
        sessionId: result.session.sessionId,
      };
    },
    public: true,
  },
  ...workflowCommands,
};

function createAgentCommandRouter({ commands = defaultCommands } = {}) {
  const registry = makeRegistry(commands);

  return {
    getCommandDefinition(command) {
      return registry.get(command) || null;
    },
    handleAgentCommand(envelope, context = {}) {
      return handleAgentCommandWithRegistry(envelope, registry, context);
    },
    registerAgentCommand(command, definition) {
      registry.set(command, normalizeCommandDefinition(command, definition));
    },
  };
}

const defaultRouter = createAgentCommandRouter();

const exported = {
  createAgentCommandRouter,
  handleAgentCommand: defaultRouter.handleAgentCommand,
  parseAgentEnvelope,
  registerAgentCommand: defaultRouter.registerAgentCommand,
};

module.exports = exported;
module.exports.default = exported;

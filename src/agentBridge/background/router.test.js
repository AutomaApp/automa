/* eslint-env node */

const assert = require('node:assert/strict');
const test = require('node:test');

const { AUDIT_LOG_KEY } = require('./audit');
const {
  clearAllTrustedSessions,
  createTrustedSession,
  saveTrustedConfig,
} = require('./capabilities');
const {
  createAgentCommandRouter,
  handleAgentCommand,
  parseAgentEnvelope,
} = require('./router');
const { createMockStorage } = require('./testUtils');

test.beforeEach(() => {
  clearAllTrustedSessions();
});

test('parseAgentEnvelope rejects malformed envelopes and missing fields', () => {
  assert.equal(parseAgentEnvelope(null).error.code, 'invalid_envelope');
  assert.equal(parseAgentEnvelope([]).error.code, 'invalid_envelope');
  assert.equal(
    parseAgentEnvelope({ command: 'agent.ping', payload: {} }).error.field,
    'id'
  );
  assert.equal(
    parseAgentEnvelope({ id: '1', payload: {} }).error.field,
    'command'
  );
  assert.equal(
    parseAgentEnvelope({ id: '1', command: 'agent.ping' }).error.field,
    'payload'
  );
  assert.equal(
    parseAgentEnvelope({ id: '1', command: 'agent.ping', payload: [] }).error
      .code,
    'invalid_field'
  );
});

test('returns unknown command as a standard error envelope', async () => {
  const storage = createMockStorage();
  const response = await handleAgentCommand(
    {
      command: 'agent.unknown',
      id: 'cmd_1',
      payload: {},
    },
    {
      now: 100,
      storage,
    }
  );

  assert.equal(response.ok, false);
  assert.equal(response.id, 'cmd_1');
  assert.equal(response.errors[0].code, 'unknown_command');
  assert.match(response.auditId, /^aud_/);
  assert.equal(storage.store[AUDIT_LOG_KEY].length, 1);
});

test('dispatches async handlers for trusted sessions', async () => {
  const storage = createMockStorage();
  const session = createTrustedSession({
    capabilities: ['test.run'],
    sessionId: 'session-1',
  });
  const router = createAgentCommandRouter({
    commands: {
      'test.run': {
        capabilities: ['test.run'],
        handler: async ({ envelope }) => ({
          echoed: envelope.payload.value,
        }),
      },
    },
  });

  const response = await router.handleAgentCommand(
    {
      command: 'test.run',
      id: 'cmd_2',
      payload: {
        value: 42,
      },
      sessionId: session.sessionId,
    },
    {
      now: 200,
      storage,
    }
  );

  assert.deepEqual(response, {
    auditId: response.auditId,
    data: {
      echoed: 42,
    },
    errors: [],
    id: 'cmd_2',
    ok: true,
    warnings: [],
  });
  assert.match(response.auditId, /^aud_/);
});

test('propagates missing capability denials before handler execution', async () => {
  const storage = createMockStorage();
  createTrustedSession({
    capabilities: ['test.read'],
    sessionId: 'session-1',
  });
  let executed = false;
  const router = createAgentCommandRouter({
    commands: {
      'test.write': {
        capabilities: ['test.write'],
        handler: async () => {
          executed = true;
        },
      },
    },
  });

  const response = await router.handleAgentCommand(
    {
      command: 'test.write',
      id: 'cmd_3',
      payload: {},
      sessionId: 'session-1',
    },
    {
      storage,
    }
  );

  assert.equal(executed, false);
  assert.equal(response.ok, false);
  assert.equal(response.errors[0].code, 'missing_capability');
  assert.equal(response.errors[0].capability, 'test.write');
});

test('normalizes thrown handler errors without leaking the thrown message', async () => {
  const storage = createMockStorage();
  createTrustedSession({
    capabilities: ['test.throw'],
    sessionId: 'session-1',
  });
  const router = createAgentCommandRouter({
    commands: {
      'test.throw': {
        capabilities: ['test.throw'],
        handler: async () => {
          throw new Error('payload contained password=secret');
        },
      },
    },
  });

  const response = await router.handleAgentCommand(
    {
      command: 'test.throw',
      id: 'cmd_4',
      payload: {},
      sessionId: 'session-1',
    },
    {
      storage,
    }
  );

  assert.equal(response.ok, false);
  assert.deepEqual(response.errors, [
    {
      code: 'handler_error',
      message: 'Command handler failed',
    },
  ]);
});

test('default trust command creates a session and default echo executes without prompt', async () => {
  const storage = createMockStorage();
  await saveTrustedConfig(
    {
      allowedCapabilities: ['agent.echo'],
      setupToken: 'setup-secret',
    },
    {
      now: 100,
      storage,
    }
  );

  const trustResponse = await handleAgentCommand(
    {
      command: 'agent.session.trust',
      id: 'cmd_trust',
      payload: {
        capabilities: ['agent.echo'],
        setupToken: 'setup-secret',
      },
    },
    {
      now: 200,
      storage,
    }
  );

  assert.equal(trustResponse.ok, true);
  assert.match(trustResponse.data.sessionId, /^agt_sess_/);

  const echoResponse = await handleAgentCommand(
    {
      command: 'agent.echo',
      id: 'cmd_echo',
      payload: {
        value: 'hello',
      },
      sessionId: trustResponse.data.sessionId,
    },
    {
      now: 300,
      storage,
    }
  );

  assert.equal(echoResponse.ok, true);
  assert.deepEqual(echoResponse.data, {
    echo: {
      value: 'hello',
    },
  });
});

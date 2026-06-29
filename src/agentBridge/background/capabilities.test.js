/* eslint-env node */

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  TRUSTED_CONFIG_KEY,
  checkRequiredCapabilities,
  clearAllTrustedSessions,
  clearTrustedSession,
  createTrustedSession,
  createTrustedSessionFromToken,
  loadTrustedConfig,
  saveTrustedConfig,
  setSetupToken,
} = require('./capabilities');
const { createMockStorage } = require('./testUtils');

test.beforeEach(() => {
  clearAllTrustedSessions();
});

test('persists trusted config and setup token in browser storage shape', async () => {
  const storage = createMockStorage();

  await saveTrustedConfig(
    {
      allowedCapabilities: ['agent.echo', 'agent.session'],
      trustedOrigins: ['http://localhost:3000'],
      verboseAudit: true,
    },
    {
      now: 100,
      storage,
    }
  );
  await setSetupToken('setup-secret', { now: 200, storage });

  assert.equal(storage.store[TRUSTED_CONFIG_KEY].setupToken, 'setup-secret');
  assert.equal(storage.store[TRUSTED_CONFIG_KEY].updatedAt, 200);
  assert.deepEqual((await loadTrustedConfig({ storage })).allowedCapabilities, [
    'agent.echo',
    'agent.session',
  ]);
});

test('creates trusted sessions from one-time setup token and consumes token', async () => {
  const storage = createMockStorage({
    [TRUSTED_CONFIG_KEY]: {
      allowedCapabilities: ['agent.echo'],
      setupToken: 'setup-secret',
    },
  });

  const result = await createTrustedSessionFromToken(
    {
      capabilities: ['agent.echo'],
      setupToken: 'setup-secret',
    },
    {
      now: 1000,
      storage,
    }
  );

  assert.equal(result.ok, true);
  assert.match(result.session.sessionId, /^agt_sess_/);
  assert.deepEqual(result.session.grantedCapabilities, ['agent.echo']);
  assert.equal(storage.store[TRUSTED_CONFIG_KEY].setupToken, null);
  assert.equal(storage.store[TRUSTED_CONFIG_KEY].tokenConsumedAt, 1000);
});

test('denies missing capabilities and allows trusted no-prompt execution', () => {
  const session = createTrustedSession(
    {
      capabilities: ['agent.echo'],
      sessionId: 'session-1',
    },
    {
      now: 500,
    }
  );

  assert.equal(
    checkRequiredCapabilities(
      ['agent.echo'],
      {
        sessionId: session.sessionId,
      },
      {
        now: 600,
      }
    ).ok,
    true
  );

  const denied = checkRequiredCapabilities(
    ['agent.session'],
    {
      sessionId: session.sessionId,
    },
    {
      now: 700,
    }
  );

  assert.equal(denied.ok, false);
  assert.equal(denied.error.code, 'missing_capability');
  assert.equal(denied.error.capability, 'agent.session');
});

test('clears in-memory sessions', () => {
  createTrustedSession({
    capabilities: ['agent.echo'],
    sessionId: 'session-1',
  });

  assert.equal(clearTrustedSession('session-1'), true);
  assert.equal(
    checkRequiredCapabilities(['agent.echo'], { sessionId: 'session-1' }).error
      .code,
    'invalid_trusted_session'
  );
});

/* eslint-env node */

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  AgentBridgeError,
  makeErrorResponse,
  makeSuccessResponse,
  normalizeError,
} = require('./errors');

test('makeSuccessResponse returns a stable JSON-safe envelope', () => {
  const circular = { ok: true };
  circular.self = circular;

  assert.deepEqual(
    makeSuccessResponse({
      auditId: 'aud_1',
      data: {
        circular,
        count: 1n,
        fn() {},
      },
      id: 'cmd_1',
    }),
    {
      auditId: 'aud_1',
      data: {
        circular: {
          ok: true,
          self: '[Circular]',
        },
        count: '1',
      },
      errors: [],
      id: 'cmd_1',
      ok: true,
      warnings: [],
    }
  );
});

test('makeErrorResponse returns a stable error envelope', () => {
  assert.deepEqual(
    makeErrorResponse({
      auditId: 'aud_2',
      errors: [
        {
          code: 'missing_capability',
          capability: 'agent.echo',
        },
      ],
      id: 'cmd_2',
    }),
    {
      auditId: 'aud_2',
      data: null,
      errors: [
        {
          capability: 'agent.echo',
          code: 'missing_capability',
          message: 'Trusted session is missing a required capability',
        },
      ],
      id: 'cmd_2',
      ok: false,
      warnings: [],
    }
  );
});

test('normalizeError keeps known bridge errors but hides generic throws', () => {
  assert.equal(
    normalizeError(
      new AgentBridgeError('setup_token_invalid', 'Setup token is invalid')
    ).code,
    'setup_token_invalid'
  );
  assert.deepEqual(normalizeError(new Error('contains payload secret')), {
    code: 'handler_error',
    message: 'Command handler failed',
  });
});

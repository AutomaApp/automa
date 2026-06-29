/* eslint-env node */

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  AUDIT_LOG_KEY,
  clearInMemoryAuditLog,
  createAuditId,
  recordAuditEvent,
  summarizePayload,
} = require('./audit');
const { createMockStorage } = require('./testUtils');

test.beforeEach(() => {
  clearInMemoryAuditLog();
});

test('generates audit ids', () => {
  assert.match(createAuditId(), /^aud_/);
});

test('redacts secrets, cookies, files, raw page data, and large logs by default', () => {
  const summary = summarizePayload({
    cookie: 'SID=secret',
    filePaths: ['/tmp/private.txt'],
    logs: Array.from({ length: 10 }, (_, index) => ({ index })),
    pageHtml: '<html>private</html>',
    safeName: 'workflow',
    token: 'secret-token',
  });

  assert.equal(summary.values.cookie.reason, 'sensitive_key');
  assert.equal(summary.values.token.reason, 'sensitive_key');
  assert.equal(summary.values.filePaths.reason, 'file_reference');
  assert.equal(summary.values.pageHtml.reason, 'raw_page_data');
  assert.equal(summary.values.logs.reason, 'table_or_log');
  assert.deepEqual(summary.values.safeName, {
    length: 8,
    type: 'string',
  });
});

test('verbose audit includes safe small values but still redacts sensitive fields', () => {
  const summary = summarizePayload(
    {
      password: 'secret',
      safeName: 'workflow',
    },
    {
      verbose: true,
    }
  );

  assert.equal(summary.values.safeName, 'workflow');
  assert.equal(summary.values.password.reason, 'sensitive_key');
});

test('records audit events to bounded storage payloads', async () => {
  const storage = createMockStorage();
  const result = await recordAuditEvent(
    {
      command: 'agent.echo',
      envelope: {
        command: 'agent.echo',
        id: 'cmd_1',
        payload: {
          token: 'secret-token',
        },
        sessionId: 'session-1',
      },
      requiredCapabilities: ['agent.echo'],
      status: 'success',
    },
    {
      now: 100,
      storage,
    }
  );

  assert.match(result.auditId, /^aud_/);
  assert.equal(storage.store[AUDIT_LOG_KEY].length, 1);
  assert.equal(
    storage.store[AUDIT_LOG_KEY][0].payloadSummary.values.token.reason,
    'sensitive_key'
  );
});

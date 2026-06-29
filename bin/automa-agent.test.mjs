/* eslint-env node */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCommandRequest,
  createBridgeServer,
  formatResponse,
  parseArgv,
  parseParams,
  runBridgeRequest,
  runCli,
} from './automa-agent.mjs';

function idGenerator() {
  let index = 0;
  return (prefix) => {
    index += 1;
    return `${prefix}_${index}`;
  };
}

function okResponse(id, data = {}) {
  return {
    auditId: 'audit_1',
    data,
    errors: [],
    id,
    ok: true,
    warnings: [],
  };
}

async function postJson(url, payload) {
  return fetch(url, {
    body: JSON.stringify(payload),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
}

test('parseArgv handles command shapes, flags, and repeated params', () => {
  const spec = parseArgv([
    'workflow',
    'add-block',
    'draft-1',
    'new-tab',
    '--alias',
    'open_site',
    '--param',
    'url=https://example.com',
    '--param',
    'active=false',
    '--param',
    'tabZoom=1.25',
    '--param',
    'tag=one',
    '--param',
    'tag=two',
    '--trusted',
    '--token',
    'setup-secret',
  ]);

  assert.equal(spec.group, 'workflow');
  assert.equal(spec.subcommand, 'add-block');
  assert.deepEqual(spec.positionals, ['draft-1', 'new-tab']);
  assert.equal(spec.flags.alias, 'open_site');
  assert.equal(spec.flags.trusted, true);
  assert.equal(spec.flags.token, 'setup-secret');
  assert.deepEqual(parseParams(spec.flags.params), {
    active: false,
    tabZoom: 1.25,
    tag: ['one', 'two'],
    url: 'https://example.com',
  });
});

test('parseArgv rejects unknown flags, missing values, invalid params, and bad format', () => {
  assert.throws(
    () => parseArgv(['workflow', 'list', '--bogus']),
    /Unknown flag --bogus/
  );
  assert.throws(
    () => parseArgv(['workflow', 'list', '--token']),
    /requires a value/
  );
  assert.throws(
    () => parseArgv(['workflow', 'get', 'wf-1', '--format', 'pretty']),
    /must be outline or raw/
  );
  assert.throws(() => parseParams(['missing-equals']), /key=value/);
});

test('help output short-circuits without bridge startup', () => {
  const request = buildCommandRequest(parseArgv(['--help']));
  assert.match(request.help, /automa-agent bridge start/);
});

test('maps workflow get to outline and raw protocol envelopes', () => {
  const outline = buildCommandRequest(
    parseArgv(['workflow', 'get', 'wf-1', '--format', 'outline']),
    { idGenerator: idGenerator() }
  );
  assert.equal(outline.envelope.command, 'workflow.getOutline');
  assert.deepEqual(outline.envelope.payload, { id: 'wf-1' });
  assert.deepEqual(outline.envelope.capabilities, ['extension:read']);
  assert.equal(outline.envelope.id, 'cmd_1');

  const raw = buildCommandRequest(
    parseArgv(['workflow', 'get', 'wf-1', '--format', 'raw']),
    { idGenerator: idGenerator() }
  );
  assert.equal(raw.envelope.command, 'workflow.getRaw');
});

test('injects trusted token payloads and keeps target command as protocol client', () => {
  const request = buildCommandRequest(
    parseArgv([
      'workflow',
      'list',
      '--trusted',
      '--token',
      'setup-secret',
      '--capability',
      'extension:read',
    ]),
    { idGenerator: idGenerator() }
  );

  assert.equal(request.trustEnvelope.command, 'agent.session.trust');
  assert.equal(request.trustEnvelope.payload.setupToken, 'setup-secret');
  assert.deepEqual(request.trustEnvelope.payload.capabilities, [
    'extension:read',
  ]);
  assert.equal(request.envelope.command, 'workflow.list');
  assert.equal(request.envelope.sessionId, undefined);
});

test('maps bridge start to ping or trusted session envelopes', () => {
  const ping = buildCommandRequest(parseArgv(['bridge', 'start']), {
    idGenerator: idGenerator(),
  });
  assert.equal(ping.envelope.command, 'agent.ping');

  const trusted = buildCommandRequest(
    parseArgv(['bridge', 'start', '--trusted', '--token', 'secret']),
    { idGenerator: idGenerator() }
  );
  assert.equal(trusted.envelope.command, 'agent.session.trust');
  assert.equal(trusted.envelope.payload.setupToken, 'secret');
  assert.equal(trusted.trustEnvelope, null);
});

test('maps every required workflow and blocks subcommand', () => {
  const cases = [
    [['workflow', 'list', '--limit', '2'], 'workflow.list', { limit: 2 }],
    [['workflow', 'begin-draft', 'wf-1'], 'workflow.beginDraft', { workflowId: 'wf-1' }],
    [
      ['workflow', 'add-block', 'draft-1', 'new-tab', '--alias', 'open', '--param', 'url=https://example.com'],
      'workflow.addBlock',
      {
        alias: 'open',
        draftId: 'draft-1',
        params: { url: 'https://example.com' },
        type: 'new-tab',
      },
    ],
    [
      ['workflow', 'connect', 'draft-1', 'open', 'extract', '--handle', '2'],
      'workflow.connectBlocks',
      {
        draftId: 'draft-1',
        handle: '2',
        params: {},
        source: 'open',
        target: 'extract',
      },
    ],
    [['workflow', 'validate', 'draft-1'], 'workflow.validate', { draftId: 'draft-1' }],
    [['workflow', 'commit', 'draft-1'], 'workflow.commitDraft', { draftId: 'draft-1' }],
    [['workflow', 'run', 'wf-1'], 'workflow.run', { id: 'wf-1', params: {} }],
    [['workflow', 'logs', 'wf-1', '--limit', '20'], 'workflow.getLogs', { id: 'wf-1', limit: 20 }],
    [['blocks', 'list'], 'blocks.list', {}],
    [['blocks', 'schema', 'new-tab'], 'blocks.getSchema', { type: 'new-tab' }],
    [['blocks', 'search', 'text', '--limit', '5'], 'blocks.search', { limit: 5, query: 'text' }],
  ];

  cases.forEach(([argv, command, payload]) => {
    const request = buildCommandRequest(parseArgv(argv), {
      idGenerator: idGenerator(),
    });
    assert.equal(request.envelope.command, command);
    assert.deepEqual(request.envelope.payload, payload);
  });
});

test('bridge server serves page, health, command queue, and correlated responses', async () => {
  const bridge = await createBridgeServer({ pollTimeoutMs: 50 });
  try {
    const page = await fetch(bridge.url).then((response) => response.text());
    assert.match(page, /Automa Agent Bridge/);
    assert.match(page, /__automa-ext__/);
    assert.match(page, /__automa-ext__agent-command/);

    const health = await fetch(bridge.url.replace('/bridge?', '/health?')).then(
      (response) => response.json()
    );
    assert.equal(health.ok, true);

    const responsePromise = bridge.sendEnvelope({
      command: 'agent.ping',
      id: 'cmd_queued',
      payload: {},
    });
    const command = await fetch(
      bridge.url.replace('/bridge?', '/bridge/commands?')
    ).then((response) => response.json());
    assert.equal(command.requestId, 'cmd_queued');
    assert.equal(command.envelope.command, 'agent.ping');

    await postJson(bridge.url.replace('/bridge?', '/bridge/responses?'), {
      requestId: 'cmd_queued',
      response: okResponse('cmd_queued', { pong: true }),
    });
    assert.deepEqual(await responsePromise, okResponse('cmd_queued', { pong: true }));
  } finally {
    await bridge.close();
  }
});

test('bridge handshake succeeds, times out, rejects bad JSON, and closes idempotently', async () => {
  const bridge = await createBridgeServer();
  try {
    const wait = bridge.waitForHandshake(500);
    await postJson(bridge.url.replace('/bridge?', '/bridge/handshake?'), {
      response: okResponse('cmd_handshake', { pong: true }),
    });
    assert.equal((await wait).response.ok, true);
    await bridge.close();
    await bridge.close();
  } finally {
    await bridge.close();
  }

  const timeoutBridge = await createBridgeServer();
  try {
    await assert.rejects(
      timeoutBridge.waitForHandshake(20),
      /Timed out waiting for extension handshake/
    );
  } finally {
    await timeoutBridge.close();
  }

  const jsonBridge = await createBridgeServer();
  try {
    const response = await fetch(
      jsonBridge.url.replace('/bridge?', '/bridge/ready?'),
      {
        body: '{',
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }
    );
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.errors[0].code, 'invalid_json');
  } finally {
    await jsonBridge.close();
  }
});

test('bridge startup reports port binding failures', async () => {
  const first = await createBridgeServer();
  const port = new URL(first.url).port;
  try {
    await assert.rejects(
      createBridgeServer({ port: Number(port) }),
      /EADDRINUSE|listen/
    );
  } finally {
    await first.close();
  }
});

test('runBridgeRequest opens Chrome, waits for handshake, establishes trust, and propagates session', async () => {
  const sent = [];
  const closed = [];
  const request = buildCommandRequest(
    parseArgv(['workflow', 'list', '--trusted', '--token', 'setup-secret']),
    { idGenerator: idGenerator() }
  );
  const response = await runBridgeRequest(request, {
    bridgeFactory: async () => ({
      close: async () => closed.push(true),
      sendEnvelope: async (envelope) => {
        sent.push(envelope);
        if (envelope.command === 'agent.session.trust') {
          return okResponse(envelope.id, { sessionId: 'session-1' });
        }
        return okResponse(envelope.id, { workflows: [] });
      },
      url: 'http://localhost:1234/bridge',
      waitForHandshake: async () => ({
        response: okResponse('cmd_handshake', { pong: true }),
      }),
    }),
    opener: async () => {},
    sessionFile: false,
  });

  assert.equal(response.ok, true);
  assert.equal(sent[0].command, 'agent.session.trust');
  assert.equal(sent[1].command, 'workflow.list');
  assert.equal(sent[1].sessionId, 'session-1');
  assert.deepEqual(closed, [true]);
});

test('runBridgeRequest returns structured timeout errors from mocked lifecycle', async () => {
  const request = buildCommandRequest(parseArgv(['workflow', 'list']), {
    idGenerator: idGenerator(),
  });

  await assert.rejects(
    runBridgeRequest(request, {
      bridgeFactory: async () => ({
        close: async () => {},
        sendEnvelope: async () => okResponse('unused'),
        url: 'http://localhost:1234/bridge',
        waitForHandshake: async () => ({
          response: {
            errors: [
              {
                code: 'bridge_handshake_timeout',
                message: 'Timed out waiting for extension handshake',
              },
            ],
            ok: false,
          },
        }),
      }),
      opener: async () => {},
      sessionFile: false,
    }),
    /Timed out waiting for extension handshake/
  );
});

test('formatResponse bounds data arrays and redacts sensitive values', () => {
  const text = formatResponse(
    {
      auditId: 'audit_1',
      data: {
        rows: [{ token: 'secret-token' }, { value: 'Bearer abc.def' }, { value: 3 }],
      },
      errors: [],
      id: 'cmd_1',
      ok: true,
      warnings: [],
    },
    {
      limit: 2,
      secrets: ['abc.def'],
    }
  );
  const parsed = JSON.parse(text);
  assert.equal(parsed.data.rows.length, 2);
  assert.equal(parsed.data.rows[0].token, '[REDACTED]');
  assert.equal(parsed.data.rows[1].value, 'Bearer [REDACTED]');
});

test('runCli prints structured errors to stderr without starting a bridge', async () => {
  let stderr = '';
  let stdout = '';
  const exitCode = await runCli(['workflow', 'list', '--bad'], {
    stderr: { write: (value) => { stderr += value; } },
    stdout: { write: (value) => { stdout += value; } },
  });

  assert.equal(exitCode, 1);
  assert.equal(stdout, '');
  const parsed = JSON.parse(stderr);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.errors[0].code, 'unknown_flag');
});

test('runCli prints successful protocol JSON to stdout and errors to stderr', async () => {
  let stderr = '';
  let stdout = '';
  const exitCode = await runCli(['bridge', 'start'], {
    bridgeFactory: async () => ({
      close: async () => {},
      sendEnvelope: async (envelope) => okResponse(envelope.id, { pong: true }),
      url: 'http://localhost:1234/bridge',
      waitForHandshake: async () => ({
        response: okResponse('cmd_handshake', { pong: true }),
      }),
    }),
    idGenerator: idGenerator(),
    opener: async () => {},
    stderr: { write: (value) => { stderr += value; } },
    stdout: { write: (value) => { stdout += value; } },
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr, '');
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.data.pong, true);
});

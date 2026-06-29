/* eslint-env node */

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  AGENT_COMMAND_EVENT,
  forwardAgentCommand,
} = require('./webServiceForwarder');

test('forwards agent command envelopes to background and correlates responses', async () => {
  const calls = [];
  const responses = [];
  const response = await forwardAgentCommand(
    {
      envelope: {
        command: 'agent.ping',
        id: 'cmd_1',
        payload: {},
      },
      requestId: 'request-1',
    },
    {
      sendMessage: async (...args) => {
        calls.push(args);
        return {
          data: {
            pong: true,
          },
          errors: [],
          id: 'cmd_1',
          ok: true,
          warnings: [],
        };
      },
      sendMessageBack: (...args) => {
        responses.push(args);
      },
    }
  );

  assert.deepEqual(calls, [
    [
      'agent:command',
      {
        command: 'agent.ping',
        id: 'cmd_1',
        payload: {},
      },
      'background',
    ],
  ]);
  assert.equal(responses[0][0], AGENT_COMMAND_EVENT);
  assert.equal(response.requestId, 'request-1');
  assert.equal(response.id, 'cmd_1');
  assert.equal(response.response.ok, true);
});

test('returns background rejection responses unchanged', async () => {
  const responses = [];
  const response = await forwardAgentCommand(
    {
      command: 'agent.echo',
      id: 'cmd_2',
      payload: {},
    },
    {
      sendMessage: async () => ({
        data: null,
        errors: [
          {
            code: 'missing_capability',
            capability: 'agent.echo',
            message: 'Trusted session is missing a required capability',
          },
        ],
        id: 'cmd_2',
        ok: false,
        warnings: [],
      }),
      sendMessageBack: (...args) => responses.push(args),
    }
  );

  assert.equal(response.response.ok, false);
  assert.equal(response.response.errors[0].code, 'missing_capability');
  assert.equal(responses[0][1].id, 'cmd_2');
});

test('handles invalid event detail without sending runtime messages', async () => {
  let sent = false;
  const responses = [];
  const response = await forwardAgentCommand(null, {
    sendMessage: async () => {
      sent = true;
    },
    sendMessageBack: (...args) => responses.push(args),
  });

  assert.equal(sent, false);
  assert.equal(response.response.ok, false);
  assert.equal(response.response.errors[0].code, 'invalid_envelope');
  assert.equal(responses[0][0], AGENT_COMMAND_EVENT);
});

test('wraps runtime send failures in JSON-safe response envelopes', async () => {
  const response = await forwardAgentCommand(
    {
      command: 'agent.ping',
      id: 'cmd_3',
      payload: {},
    },
    {
      sendMessage: async () => {
        const error = new Error('runtime closed');
        error.code = 'runtime_error';
        throw error;
      },
      sendMessageBack: () => {},
    }
  );

  assert.equal(response.response.ok, false);
  assert.equal(response.response.id, 'cmd_3');
  assert.equal(response.response.errors[0].code, 'runtime_error');
});

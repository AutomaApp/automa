/* eslint-env browser, node, webextensions */

const { isPlainObject, makeErrorResponse } = require('../background/errors');

const AGENT_COMMAND_EVENT = 'agent-command';

function getEnvelope(data) {
  if (!isPlainObject(data)) return null;
  if (isPlainObject(data.envelope)) return data.envelope;
  return data;
}

function getCorrelation(data, envelope) {
  if (!isPlainObject(data)) {
    return {
      id: null,
      requestId: null,
    };
  }

  return {
    id: envelope?.id || data.id || null,
    requestId: data.requestId || data.id || envelope?.id || null,
  };
}

function makeResponsePayload(data, envelope, response) {
  return {
    ...getCorrelation(data, envelope),
    response,
  };
}

function makeForwardError(data, envelope, code, message) {
  return makeResponsePayload(
    data,
    envelope,
    makeErrorResponse({
      errors: [
        {
          code,
          message,
        },
      ],
      id: envelope?.id || data?.id || null,
    })
  );
}

async function forwardAgentCommand(data, { sendMessage, sendMessageBack }) {
  const envelope = getEnvelope(data);

  if (!envelope) {
    const payload = makeForwardError(
      data,
      envelope,
      'invalid_envelope',
      'Agent command event detail must be an object'
    );
    sendMessageBack(AGENT_COMMAND_EVENT, payload);
    return payload;
  }

  try {
    const response = await sendMessage('agent:command', envelope, 'background');
    const payload = makeResponsePayload(data, envelope, response);
    sendMessageBack(AGENT_COMMAND_EVENT, payload);
    return payload;
  } catch (error) {
    const payload = makeForwardError(
      data,
      envelope,
      error?.code || 'handler_error',
      error?.message || 'Background agent command failed'
    );
    sendMessageBack(AGENT_COMMAND_EVENT, payload);
    return payload;
  }
}

const exported = {
  AGENT_COMMAND_EVENT,
  forwardAgentCommand,
};

module.exports = exported;
module.exports.default = exported;

import { nanoid } from 'nanoid';
import { messageSandbox } from './helper';
import renderString from './templating/renderString';

async function javascriptCode(event, refData) {
  const instanceId = `automa${nanoid()}`;

  await messageSandbox('javascriptBlock', {
    refData,
    instanceId,
    preloadScripts: [],
    blockData: {
      code: event.code,
    },
  });
}

async function httpRequest({ url, method, headers, body }, refData) {
  if (!url.trim()) return;

  const reqHeaders = {
    'Content-Type': 'application/json',
  };
  headers.forEach((header) => {
    reqHeaders[header.name] = header.value;
  });

  const renderedBody =
    method !== 'GET' ? (await renderString(body, refData)).value : undefined;

  await fetch(url, {
    method,
    body: renderedBody,
    headers: reqHeaders,
  });
}

const eventHandlerMap = {
  'js-code': javascriptCode,
  'http-request': httpRequest,
};

export async function workflowEventHandler(event, refData) {
  try {
    await eventHandlerMap[event.type](event, refData);
  } catch (error) {
    console.error(error);
  }
}

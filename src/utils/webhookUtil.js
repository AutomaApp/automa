import { isObject, parseJSON, isWhitespace } from './helper';

const renderContent = (content, contentType) => {
  const renderedJson = parseJSON(content, new Error('invalid-body'));

  if (renderedJson instanceof Error) throw renderedJson;

  if (contentType === 'application/x-www-form-urlencoded') {
    return Object.keys(renderedJson)
      .map((key) => {
        const value = isObject(renderedJson[key])
          ? JSON.stringify(renderedJson[key])
          : renderedJson[key];

        return `${key}=${value}`;
      })
      .join('&');
  }

  return JSON.stringify(renderedJson);
};

const filterHeaders = (headers) => {
  const filteredHeaders = {};
  headers.forEach((item) => {
    if (item.name && item.value) {
      filteredHeaders[item.name] = item.value;
    }
  });
  return filteredHeaders;
};

const contentTypes = {
  json: 'application/json',
  form: 'application/x-www-form-urlencoded',
};
const notHaveBody = ['GET', 'DELETE'];

export async function executeWebhook({
  url,
  contentType,
  headers,
  timeout,
  body,
  method,
}) {
  const controller = new AbortController();
  const controllerId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const finalHeaders = filterHeaders(headers);
    const contentTypeHeader = contentTypes[contentType || 'json'];

    const payload = {
      method: method || 'POST',
      headers: {
        'Content-Type': contentTypeHeader,
        ...finalHeaders,
      },
      signal: controller.signal,
    };

    if (!notHaveBody.includes(method || 'POST') && !isWhitespace(body)) {
      payload.body = renderContent(body, payload.headers['Content-Type']);
    }

    const response = await fetch(url, payload);

    clearTimeout(controllerId);

    return response;
  } catch (error) {
    clearTimeout(controllerId);
    throw error;
  }
}

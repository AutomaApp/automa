import { parseJSON, isWhitespace } from './helper';

const renderContent = (content, contentType) => {
  if (contentType === 'text/plain') return content;

  const renderedJson = parseJSON(content, new Error('invalid-body'));

  if (renderedJson instanceof Error) throw renderedJson;

  if (contentType === 'application/x-www-form-urlencoded') {
    return new URLSearchParams(renderedJson);
  }
  if (contentType === 'multipart/form-data') {
    if (!Array.isArray(renderedJson) || !Array.isArray(renderedJson[0])) {
      throw new Error('The body must be 2D Array');
    }

    const formData = new FormData();
    renderedJson.forEach((data) => {
      formData.append(...data);
    });

    return formData;
  }

  return JSON.stringify(renderedJson);
};

const filterHeaders = (headers) => {
  const filteredHeaders = {};

  if (!headers || !Array.isArray(headers)) return filteredHeaders;

  headers.forEach((item) => {
    if (item.name && item.value) {
      filteredHeaders[item.name] = item.value;
    }
  });
  return filteredHeaders;
};

const contentTypes = {
  text: 'text/plain',
  json: 'application/json',
  'form-data': 'multipart/form-data',
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
  const timeoutId = setTimeout(() => {
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

    clearTimeout(timeoutId);

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

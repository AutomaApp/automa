import { isObject } from './helper';

const renderContent = (content, contentType) => {
  // 1. render the content
  // 2. if the content type is json then parse the json
  // 3. else parse to form data
  const renderedJson = JSON.parse(content);

  if (contentType === 'form') {
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

const convertContentType = (contentType) => {
  return contentType === 'json'
    ? 'application/json'
    : 'application/x-www-form-urlencoded';
};

export async function executeWebhook({
  url,
  contentType,
  headers,
  timeout,
  body,
}) {
  const controller = new AbortController();
  const id = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const finalHeaders = filterHeaders(headers);
    const finalContent = renderContent(body, contentType);

    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': convertContentType(contentType),
        ...finalHeaders,
      },
      body: finalContent,
      signal: controller.signal,
    });

    clearTimeout(id);
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

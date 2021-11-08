/* eslint-disable no-console */
import Mustache from 'mustache';

const customTags = ['{%', '%}'];
const renderContent = (content, workflowData, contentType) => {
  console.log('renderContent', content, workflowData);
  // 1. render the content
  // 2. if the content type is json then parse the json
  // 3. else parse to form data
  const renderedJson = JSON.parse(
    Mustache.render(content, workflowData, {}, customTags)
  );
  if (contentType === 'form') {
    return Object.keys(renderedJson)
      .map((key) => {
        return `${key}=${renderedJson[key]}`;
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

export function executeWebhook({
  url,
  contentType,
  headers,
  timeout,
  content,
  workflowData,
}) {
  const finalContent = renderContent(content, workflowData, contentType);
  const finalHeaders = filterHeaders(headers);
  console.log(
    'executeWebhook',
    url,
    contentType,
    finalHeaders,
    timeout,
    finalContent,
    workflowData
  );
  const controller = new AbortController();
  const id = setTimeout(() => {
    controller.abort();
  }, timeout);

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': convertContentType(contentType),
      ...finalHeaders,
    },
    body: finalContent,
    signal: controller.signal,
  })
    .then(() => {
      clearTimeout(id);
    })
    .catch((err) => {
      clearTimeout(id);
      throw err;
    });
}

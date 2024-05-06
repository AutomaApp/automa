import { nanoid } from 'nanoid';
import { messageSandbox } from './helper';
import renderString from './templating/renderString';

class WorkflowEvent {
  static async #httpRequest({ url, method, headers, body }, refData) {
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

  static async #javascriptCode(event, refData) {
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

  static async handle(event, refData) {
    switch (event.type) {
      case 'http-request':
        await this.#httpRequest(event, refData);
        break;
      case 'js-code':
        await this.#javascriptCode(event, refData);
        break;
      default:
    }
  }
}

export default WorkflowEvent;

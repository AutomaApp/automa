import browser from 'webextension-polyfill';
import { objectHasKey } from './helper';

const nameBuilder = (prefix, name) => (prefix ? `${prefix}--${name}` : name);
const isFirefox = BROWSER_TYPE === 'firefox';

export class MessageListener {
  constructor(prefix = '') {
    this.listeners = {};
    this.prefix = prefix;
  }

  on(name, listener) {
    if (objectHasKey(this.listeners, 'name')) {
      console.error(`You already added ${name}`);
      return this.on;
    }

    this.listeners[nameBuilder(this.prefix, name)] = listener;

    return this.on;
  }

  listener() {
    return this.listen.bind(this);
  }

  listen(message, sender) {
    try {
      if (isFirefox) message = JSON.parse(message);

      const listener = this.listeners[message.name];
      const response =
        listener && listener.call({ message, sender }, message.data, sender);

      if (!response) {
        return Promise.resolve();
      }
      if (!(response instanceof Promise)) {
        return Promise.resolve(response);
      }
      return response;
    } catch (err) {
      return Promise.reject(
        new Error(`Unhandled Background Error: ${String(err)}`)
      );
    }
  }
}

export function sendMessage(name = '', data = {}, prefix = '') {
  let payload = {
    name: nameBuilder(prefix, name),
    data,
  };

  if (isFirefox) {
    payload = JSON.stringify(payload);
  }

  return browser.runtime.sendMessage(payload);
}

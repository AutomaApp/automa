import browser from 'webextension-polyfill';
import { objectHasKey } from './helper';

const nameBuilder = (prefix, name) => (prefix ? `${prefix}--${name}` : name);

export class MessageListener {
  constructor(prefix = '') {
    this.listeners = {};
    this.prefix = prefix;
  }

  on(name, listener) {
    if (objectHasKey(this.listeners, 'name')) {
      console.error(`You already added ${name}`);
      return;
    }

    this.listeners[nameBuilder(this.prefix, name)] = listener;
  }

  listener() {
    return this.listen.bind(this);
  }

  listen(message, sender) {
    try {
      const listener = this.listeners[message.name];
      console.log(listener, this.listeners);
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
  const payload = {
    name: nameBuilder(prefix, name),
    data,
  };

  return browser.runtime.sendMessage(payload);
}

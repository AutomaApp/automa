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

  listen(message, sender, sendResponse) {
    try {
      const listener = this.listeners[message.name];

      const response =
        listener && listener.call({ message, sender }, message.data, sender);

      if (!response) {
        // Do nothing
      } else if (!(response instanceof Promise)) {
        sendResponse(response);
      } else {
        response
          .then((res) => {
            sendResponse(res);
          })
          .catch((res) => {
            sendResponse(res);
          });
      }
    } catch (err) {
      sendResponse({
        error: true,
        message: `Unhandled Background Error: ${String(err)}`,
      });
    }
  }
}

export function sendMessage(name = '', data = {}, prefix = '') {
  return new Promise((resolve, reject) => {
    const payload = {
      name: nameBuilder(prefix, name),
      data,
    };

    browser.runtime
      .sendMessage(payload)
      .then((response) => {
        if (response.error) reject(new Error(response.message));
        else resolve(response);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

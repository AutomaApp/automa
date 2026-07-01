import browser from 'webextension-polyfill';

const nameBuilder = (prefix, name) => (prefix ? `${prefix}--${name}` : name);
const isFirefox = BROWSER_TYPE === 'firefox';

/**
 *
 * @param {string=} name
 * @param {*=} data
 * @param {string=} prefix
 *
 * @returns {Promise<*>}
 */
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

export class MessageListener {
  static sendMessage = sendMessage;

  constructor(prefix = '') {
    this.listeners = {};
    this.prefix = prefix;

    this.listener = this.listener.bind(this);
  }

  on(name, listener) {
    if (Object.hasOwn(this.listeners, name)) {
      console.error(`You already added ${name}`);
      return this.on;
    }

    this.listeners[nameBuilder(this.prefix, name)] = listener;

    return this.on;
  }

  listener(message, sender) {
    try {
      if (isFirefox) message = JSON.parse(message);

      const listener = this.listeners[message.name];
      const response =
        listener && listener.call({ message, sender }, message.data, sender);

      const _prefix = message.name.split('--')[0];
      // 如果消息有明确的前缀
      if (_prefix && _prefix !== message.name) {
        // 只有当前缀匹配时才处理
        if (_prefix === this.prefix) {
          if (!response) return Promise.resolve();
          if (!(response instanceof Promise)) return Promise.resolve(response);
          return response;
        }
        // 对于不匹配的前缀消息，不返回任何响应
        // eslint-disable-next-line consistent-return
        return;
      }

      // 对于没有前缀的消息，保持原有行为
      if (!response) return Promise.resolve();
      if (!(response instanceof Promise)) return Promise.resolve(response);
      return response;
    } catch (err) {
      return Promise.reject(
        new Error(`Unhandled Background Error: ${String(err)}`)
      );
    }
  }

  /**
   *
   * @param {string} name
   * @param {*} data
   *
   * @returns {Promise<*>}
   */
  sendMessage(name, data) {
    return sendMessage(name, data, this.prefix);
  }
}

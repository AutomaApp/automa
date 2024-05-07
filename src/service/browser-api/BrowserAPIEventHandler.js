/* eslint-disable class-methods-use-this */

import { MessageListener } from '@/utils/message';
import { browserAPIMap } from './browser-api-map';

const BROWSER_API_EVENTS = {
  ON_EVENT: 'browser-api:on-browser-event',
  TOGGLE: 'browser-api:toggle-browser-event-listener',
};

function onBrowserAPIEvent(name, ...args) {
  MessageListener.sendMessage(
    BROWSER_API_EVENTS.ON_EVENT,
    { name, args },
    'offscreen'
  );
}

/**
 * @typedef { 'chrome.debugger.onEvent' | 'browser.tabs.onRemoved' | 'browser.webNavigation.onCreatedNavigationTarget' | 'browser.windows.onRemoved' } BrowserAPIEventsName
 */

class BrowserAPIEventHandler {
  /** @type {BrowserAPIEventHandler} */
  static #_instance;

  /**
   * BrowserAPIEventHandler singleton
   * @type {BrowserAPIEventHandler}
   */
  static get instance() {
    if (!this.#_instance) this.#_instance = new BrowserAPIEventHandler();

    return this.#_instance;
  }

  static RuntimeEvents = BROWSER_API_EVENTS;

  /** @type {Record<string, ((...args: unknown[]) => void)[]>} */
  #events;

  /** @type {Record<string, { addListener: (...args: unknown[]) => void, removeListener: (...args: unknown[]) => void }>} */
  #eventsHandler;

  /** @type {Set<string>} */
  #isEventAdded;

  /** @type {Record<string, ((...args: unknown[]) => void)>} */
  #browserEvents;

  constructor() {
    this.#events = {};
    this.#browserEvents = {};
    this.#eventsHandler = {};

    this.#isEventAdded = new Set();
  }

  /**
   * @param {BrowserAPIEventsName} name
   * @param {*} browserAPI
   */
  createEventListener(name) {
    if (this.#eventsHandler[name]) return this.#eventsHandler[name];

    if (!this.#events[name]) this.#events[name] = [];

    /**
     * This callback is displayed as a global member.
     * @callback eventListenerCallback
     * @param {...*} args
     */

    /**
     * @param {eventListenerCallback} callback
     */
    const addListener = (callback) => {
      this.#events[name].push(callback);

      if (this.#isEventAdded.has(name)) return;

      MessageListener.sendMessage(
        BROWSER_API_EVENTS.TOGGLE,
        {
          name,
          type: 'add',
        },
        'background'
      ).then(() => {
        this.#isEventAdded.add(name);
      });
    };

    /**
     * @param {eventListenerCallback} callback
     */
    const removeListener = (callback) => {
      const index = this.#events[name].indexOf(callback);
      if (index === -1) return;

      this.#events[name].splice(index, 1);

      if (this.#events[name].length > 0) return;

      MessageListener.sendMessage(
        BROWSER_API_EVENTS.TOGGLE,
        {
          name,
          type: 'remove',
        },
        'background'
      );
      delete this.#eventsHandler[name];
    };

    const hasListeners = () => {
      return this.#events[name].length > 0;
    };

    /**
     * @param {eventListenerCallback} callback
     */
    const hasListener = (callback) => {
      return this.#events[name].includes(callback);
    };

    this.#eventsHandler[name] = {
      addListener,
      hasListener,
      hasListeners,
      removeListener,
    };

    return this.#eventsHandler[name];
  }

  /**
   * @param {{ name: BrowserAPIEventsName, args: unknown[] }} event
   */
  onBrowserEventListener(event) {
    if (!event.name || !this.#events[event.name]) return;

    this.#events[event.name].forEach((listener) => listener(...event.args));
  }

  /**
   * @param {{ name: BrowserAPIEventsName, type: 'add' | 'remove' }} data
   */
  onToggleBrowserEventListener({ name, type }) {
    const isAddListener = type === 'add';

    if (isAddListener && this.#browserEvents[name]) return;
    if (!isAddListener && !this.#browserEvents[name]) return;

    const browserEventAPI = browserAPIMap
      .find((item) => item.path === name && item.isEvent)
      ?.api();
    if (!browserAPIMap) return;

    const eventType = isAddListener ? 'addListener' : 'removeListener';
    const listener = isAddListener
      ? onBrowserAPIEvent.bind(null, name)
      : this.#browserEvents[name];

    if (isAddListener) this.#browserEvents[name] = listener;

    browserEventAPI[eventType](listener);
  }
}

export default BrowserAPIEventHandler;

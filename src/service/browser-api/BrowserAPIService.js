/* eslint-disable max-classes-per-file */
/* eslint-disable prefer-rest-params */
import { MessageListener } from '@/utils/message';
import {
  deserializeFunctions,
  serializeFunctions,
} from '@/utils/serialization';
import objectPath from 'object-path';
import Browser from 'webextension-polyfill';
import BrowserAPIEventHandler from './BrowserAPIEventHandler';
import { browserAPIMap } from './browser-api-map';

/**
 * @typedef {Object} ScriptInjectTarget
 * @property {number} tabId
 * @property {number=} frameId
 * @property {boolean=} allFrames
 */

// Maybe there's a better way?
export const IS_BROWSER_API_AVAILABLE = 'tabs' in Browser;

function sendBrowserApiMessage(name, ...args) {
  const serializedArgs = serializeFunctions(args);

  return MessageListener.sendMessage(
    'browser-api',
    {
      name,
      args: serializedArgs,
    },
    'background'
  );
}

class BrowserContentScript {
  /**
   * Check if content script injected
   * @param {ScriptInjectTarget} target
   * @param {string=} messageId
   */
  static async isContentScriptInjected(target, messageId) {
    if (!IS_BROWSER_API_AVAILABLE) {
      return sendBrowserApiMessage(
        'contentScript.isContentScriptInjected',
        ...arguments
      );
    }

    try {
      // 发送测试消息到目标标签页
      await Browser.tabs.sendMessage(
        target.tabId,
        { type: messageId || 'content-script-exists' },
        {
          frameId: target.allFrames ? undefined : target.frameId,
        }
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Inject content script into targeted tab
   * @param {Object} script
   * @param {ScriptInjectTarget} script.target
   * @param {string} script.file
   * @param {boolean=} script.injectImmediately
   * @param {(boolean|{timeoutMs?: number, maxTry?: number, messageId?: string})=} script.waitUntilInjected
   * @returns {Promise<boolean>}
   */
  static async inject({ file, target, injectImmediately, waitUntilInjected }) {
    if (!IS_BROWSER_API_AVAILABLE) {
      return sendBrowserApiMessage('contentScript.inject', ...arguments);
    }

    const frameId =
      Object.hasOwn(target, 'frameId') && !target.allFrames
        ? target.frameId
        : undefined;

    // MV2 or firefox
    if (Browser.tabs.injectContentScript) {
      await Browser.tabs.executeScript(target.tabId, {
        file,
        frameId,
        allFrames: target.allFrames,
      });
    } else {
      // MV3 chrome
      await Browser.scripting.executeScript({
        target: {
          tabId: target.tabId,
          allFrames: target.allFrames,
          frameIds: typeof frameId === 'number' ? [frameId] : undefined,
        },
        files: [file],
        injectImmediately,
      });
    }

    if (!waitUntilInjected) return true;

    const maxTryCount = waitUntilInjected.maxTry ?? 3;
    const timeoutMs = waitUntilInjected.timeoutMs ?? 1000;

    let tryCount = 0;

    return new Promise((resolve) => {
      const checkIfInjected = async () => {
        try {
          if (tryCount > maxTryCount) {
            resolve(false);
            return;
          }

          tryCount += 1;

          const isInjected = await BrowserContentScript.isContentScriptInjected(
            target,
            waitUntilInjected.messageId
          );
          if (isInjected) {
            resolve(true);
            return;
          }

          setTimeout(() => checkIfInjected(), timeoutMs);
        } catch (error) {
          console.error(error);
          setTimeout(() => checkIfInjected(), timeoutMs);
        }
      };
      checkIfInjected();
    });
  }

  /**
   * Check if content script injected
   * @param {ScriptInjectTarget} target
   * @param {string=} messageId
   */
  static async isInjected({ tabId, allFrames, frameId }, messageId) {
    if (!IS_BROWSER_API_AVAILABLE) {
      return sendBrowserApiMessage('contentScript.isInjected', ...arguments);
    }

    try {
      await Browser.tabs.sendMessage(
        tabId,
        { type: messageId || 'content-script-exists' },
        { frameId: allFrames ? undefined : frameId }
      );

      return true;
    } catch (error) {
      return false;
    }
  }
}

class BrowserAPIService {
  /**
   * Handle runtime message that send by BrowserAPIService when API is not available
   * @param {{ name: string; args: any[] }} payload;
   */
  static runtimeMessageHandler({ args, name }) {
    const deserializedArgs = deserializeFunctions(args);
    const apiHandler = objectPath.get(this, name);
    if (!apiHandler) throw new Error(`"${name}" is invalid method`);

    return deserializedArgs ? apiHandler(...deserializedArgs) : apiHandler();
  }

  static runtime = Browser.runtime;

  /** @type {typeof Browser.tabs} */
  static tabs;

  /** @type {typeof Browser.proxy} */
  static proxy;

  /** @type {typeof Browser.storage} */
  static storage;

  /** @type {typeof Browser.windows} */
  static windows;

  /** @type {typeof chrome.debugger} */
  static debugger;

  /** @type {typeof Browser.webNavigation} */
  static webNavigation;

  /** @type {typeof Browser.permissions} */
  static permissions;

  /** @type {typeof Browser.downloads} */
  static downloads;

  /** @type {typeof Browser.notifications} */
  static notifications;

  /** @type {typeof Browser.browserAction} */
  static browserAction;

  /** @type {typeof Browser.extension} */
  static extension;

  static contentScript = BrowserContentScript;
}

(() => {
  browserAPIMap.forEach((item) => {
    let value;
    if (IS_BROWSER_API_AVAILABLE) {
      value = item.api();
    } else {
      value = item.isEvent
        ? BrowserAPIEventHandler.instance.createEventListener(item.path)
        : (...args) => sendBrowserApiMessage(item.path, ...args);
    }

    objectPath.set(BrowserAPIService, item.path, value);
  });
})();

export default BrowserAPIService;

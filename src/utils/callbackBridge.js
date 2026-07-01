import { MessageListener } from './message';

/**
 * Check if an object is a callback bridge handler
 * @param {*} obj - Object to check
 * @returns {boolean} - True if object is a callback bridge
 */
export function isCallbackBridge(obj) {
  return obj && typeof obj === 'object' && obj.__type === 'callback_bridge';
}

/**
 * Simple callback bridge for cross-context communication in Chrome MV3
 * Uses Promise-based message passing instead of storing functions
 */
class CallbackBridge {
  constructor() {
    this.pendingCallbacks = new Map();
    this.setupMessageHandlers();
  }

  setupMessageHandlers() {
    const message = new MessageListener('callback-bridge');

    message.on('resolve-callback', ({ callbackId, result, error }) => {
      const pendingCallback = this.pendingCallbacks.get(callbackId);
      if (pendingCallback) {
        this.pendingCallbacks.delete(callbackId);
        if (error) {
          pendingCallback.reject(new Error(error));
        } else {
          pendingCallback.resolve(result);
        }
      }
    });

    // Set up message listener
    if (typeof browser !== 'undefined' && browser.runtime) {
      browser.runtime.onMessage.addListener(message.listener);
    }
  }

  /**
   * Convert callback function to Promise-based message
   * @param {Function} callback - The callback function to convert
   * @param {string} callbackId - Unique identifier for this callback
   * @returns {Object} - Message-compatible callback handler
   */
  createCallbackHandler(callback, callbackId) {
    // Store the original callback temporarily
    const callbackPromise = new Promise((resolve, reject) => {
      this.pendingCallbacks.set(callbackId, { resolve, reject });

      // Add timeout to prevent memory leaks
      setTimeout(() => {
        if (this.pendingCallbacks.has(callbackId)) {
          this.pendingCallbacks.delete(callbackId);
          reject(new Error(`Callback ${callbackId} timed out`));
        }
      }, 300000); // 5 minutes timeout
    });

    // Execute original callback when promise resolves
    callbackPromise
      .then((result) => {
        try {
          callback(result);
        } catch (error) {
          console.error('Error executing callback:', error);
        }
      })
      .catch((error) => {
        console.error('Callback promise rejected:', error);
      });

    // Return message-compatible handler
    return {
      __type: 'callback_bridge',
      __callbackId: callbackId,
    };
  }

  /**
   * Execute callback from message data
   * @param {string} callbackId - The callback identifier
   * @param {*} result - Result to pass to callback
   * @param {string|null} error - Error message if any
   */
  static async executeCallback(callbackId, result, error = null) {
    try {
      await MessageListener.sendMessage(
        'resolve-callback',
        { callbackId, result, error },
        'callback-bridge'
      );
    } catch (err) {
      console.error(`Failed to execute callback ${callbackId}:`, err);
    }
  }

  static generateCallbackId() {
    return `cb_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}

// Global instance
const callbackBridge = new CallbackBridge();

/**
 * Process data to convert callbacks to bridge handlers
 * @param {*} obj - Data to process
 * @param {CallbackBridge} bridge - Bridge instance
 * @returns {*} - Processed data
 */
function processCallbacksInData(obj, bridge) {
  if (typeof obj === 'function') {
    const callbackId = CallbackBridge.generateCallbackId();
    return bridge.createCallbackHandler(obj, callbackId);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => processCallbacksInData(item, bridge));
  }

  if (obj && typeof obj === 'object') {
    const result = {};
    Object.keys(obj).forEach((key) => {
      result[key] = processCallbacksInData(obj[key], bridge);
    });
    return result;
  }

  return obj;
}

/**
 * Enhanced message sending that handles callbacks automatically
 * @param {string} messageName - Message name
 * @param {Object} data - Message data (may contain callbacks)
 * @param {string} prefix - Message prefix
 * @returns {Promise} - Message response
 */
export async function sendMessageWithCallbacks(messageName, data, prefix = '') {
  const processedData = processCallbacksInData(data, callbackBridge);
  return MessageListener.sendMessage(messageName, processedData, prefix);
}

/**
 * Process received data to execute callbacks
 * @param {*} obj - Received data
 * @param {*} result - Result to pass to callbacks
 * @param {string|null} error - Error message if any
 */
export async function executeCallbacksInData(obj, result, error = null) {
  if (isCallbackBridge(obj)) {
    await CallbackBridge.executeCallback(obj.__callbackId, result, error);
    return;
  }

  if (Array.isArray(obj)) {
    await Promise.all(
      obj.map((item) => executeCallbacksInData(item, result, error))
    );
    return;
  }

  if (obj && typeof obj === 'object') {
    await Promise.all(
      Object.values(obj).map((value) =>
        executeCallbacksInData(value, result, error)
      )
    );
  }
}

/**
 * Check if data contains any callback bridge handlers
 * @param {*} obj - Data to check
 * @returns {boolean} - True if data contains callback bridges
 */
export function hasCallbackBridges(obj) {
  if (isCallbackBridge(obj)) {
    return true;
  }

  if (Array.isArray(obj)) {
    return obj.some(hasCallbackBridges);
  }

  if (obj && typeof obj === 'object') {
    return Object.values(obj).some(hasCallbackBridges);
  }

  return false;
}

/**
 * Get all callback bridge IDs from data
 * @param {*} obj - Data to extract IDs from
 * @returns {string[]} - Array of callback IDs
 */
export function getCallbackBridgeIds(obj) {
  const ids = [];

  function collectIds(data) {
    if (isCallbackBridge(data)) {
      ids.push(data.__callbackId);
      return;
    }

    if (Array.isArray(data)) {
      data.forEach(collectIds);
      return;
    }

    if (data && typeof data === 'object') {
      Object.values(data).forEach(collectIds);
    }
  }

  collectIds(obj);
  return ids;
}

export { callbackBridge };

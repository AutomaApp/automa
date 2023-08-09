/* eslint-disable  no-param-reassign */
import browser from 'webextension-polyfill';

class WorkflowState {
  constructor({ storage, key = 'workflowState' }) {
    this.key = key;
    this.storage = storage;

    this.states = new Map();
    this.eventListeners = {};

    this.storageTimeout = null;
  }

  _updateBadge() {
    const browserAction = browser.action || browser.browserAction;
    browserAction.setBadgeText({ text: (this.states.size || '').toString() });
  }

  _saveToStorage() {
    if (this.storageTimeout) return;

    this.storageTimeout = setTimeout(() => {
      this.storageTimeout = null;

      const states = Object.fromEntries(this.states);
      this.storage.set(this.key, states);
    }, 1000);
  }

  dispatchEvent(name, params) {
    const listeners = this.eventListeners[name];

    if (!listeners) return;

    listeners.forEach((callback) => {
      callback(params);
    });
  }

  on(name, listener) {
    (this.eventListeners[name] = this.eventListeners[name] || []).push(
      listener
    );
  }

  off(name, listener) {
    const listeners = this.eventListeners[name];
    if (!listeners) return;

    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
  }

  get getAll() {
    return this.states;
  }

  async get(stateId) {
    let { states } = this;

    if (typeof stateId === 'function') {
      states = Array.from(states.entries()).find(({ 1: state }) =>
        stateId(state)
      );
    } else if (stateId) {
      states = this.states.get(stateId);
    }

    return states;
  }

  async add(id, data = {}) {
    this.states.set(id, data);
    this._updateBadge();
    this._saveToStorage(this.key);
  }

  async stop(id) {
    const isStateExist = await this.get(id);
    if (!isStateExist) {
      await this.delete(id);
      this.dispatchEvent('stop', id);
      return id;
    }

    await this.update(id, { isDestroyed: true });
    this.dispatchEvent('stop', id);
    return id;
  }

  async resume(id, nextBlock) {
    const state = this.states.get(id);
    if (!state) return;

    this.states.set(id, {
      ...state,
      status: 'running',
    });
    this._saveToStorage();

    this.dispatchEvent('resume', { id, nextBlock });
  }

  async update(id, data = {}) {
    const state = this.states.get(id);
    if (!state) return;

    if (data?.state?.status) {
      state.status = data.state.status;
      delete data.state.status;
    }

    this.states.set(id, { ...state, ...data });
    this.dispatchEvent('update', { id, data });
    this._saveToStorage();
  }

  async delete(id) {
    this.states.delete(id);
    this.dispatchEvent('delete', id);
    this._updateBadge();
    this._saveToStorage();
  }
}

export default WorkflowState;

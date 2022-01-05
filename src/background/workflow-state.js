/* eslint-disable  no-param-reassign */

class WorkflowState {
  constructor({ storage, key = 'workflowState' }) {
    this.key = key;
    this.storage = storage;
    this.eventListeners = {};
  }

  async _updater(callback, event) {
    try {
      const storageStates = await this.get();
      const states = callback(storageStates);

      await this.storage.set(this.key, states);

      if (event) {
        this.dispatchEvent(event.name, event.params);
      }

      return states;
    } catch (error) {
      console.error(error);

      return [];
    }
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

  async get(stateId) {
    try {
      let states = (await this.storage.get(this.key)) || {};

      if (Array.isArray(states)) {
        states = {};
        await this.storage.set(this.key, {});
      }

      if (typeof stateId === 'function') {
        states = Object.values(states).find(stateId);
      } else if (stateId) {
        states = states[stateId];
      }

      return states;
    } catch (error) {
      console.error(error);

      return null;
    }
  }

  add(id, data = {}) {
    return this._updater((states) => {
      states[id] = {
        id,
        isPaused: false,
        isDestroyed: false,
        ...data,
      };

      return states;
    });
  }

  async stop(id) {
    await this.update(id, { isDestroyed: true });

    this.dispatchEvent('stop', id);

    return id;
  }

  update(id, data = {}) {
    const event = {
      name: 'update',
      params: { id, data },
    };

    return this._updater((states) => {
      if (states[id]) {
        states[id] = { ...states[id], ...data };
      }

      return states;
    }, event);
  }

  delete(id) {
    const event = {
      name: 'delete',
      params: id,
    };

    return this._updater((states) => {
      delete states[id];

      return states;
    }, event);
  }
}

export default WorkflowState;

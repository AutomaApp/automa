/* eslint-disable  no-param-reassign */

class WorkflowState {
  constructor({ storage, key = 'workflowState' }) {
    this.key = key;
    this.storage = storage;
  }

  async _updater(callback) {
    try {
      const storageStates = await this.get();
      const states = callback(storageStates);

      await this.storage.set(this.key, states);

      return states;
    } catch (error) {
      console.error(error);

      return [];
    }
  }

  async get(stateId) {
    try {
      let states = (await this.storage.get(this.key)) || {};

      if (Array.isArray(states)) {
        states = {};
        await this.storage.set(this.key, {});
      }

      if (typeof stateId === 'function') {
        states = Object.values(storageStates).find(stateId);
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

  update(id, data = {}) {
    return this._updater((states) => {
      if (states[id]) {
        states[id] = { ...states[id], ...data };
      }

      return states;
    });
  }

  delete(id) {
    return this._updater((states) => {
      delete states[id];

      return states;
    });
  }
}

export default WorkflowState;

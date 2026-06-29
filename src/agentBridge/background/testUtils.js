/* eslint-env node */

function createMockStorage(initialStore = {}) {
  const store = { ...initialStore };

  return {
    async get(keys) {
      if (typeof keys === 'string') return { [keys]: store[keys] };
      if (Array.isArray(keys)) {
        return keys.reduce((result, key) => {
          result[key] = store[key];
          return result;
        }, {});
      }

      return { ...store };
    },
    async remove(keys) {
      (Array.isArray(keys) ? keys : [keys]).forEach((key) => {
        delete store[key];
      });
    },
    async set(values) {
      Object.assign(store, values);
    },
    store,
  };
}

module.exports = {
  createMockStorage,
};

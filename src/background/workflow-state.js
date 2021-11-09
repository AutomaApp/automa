/* eslint-disable  no-param-reassign */
import browser from 'webextension-polyfill';

async function updater(callback, id) {
  try {
    const state = await this.get();
    const index = id ? state.findIndex((item) => item.id === id) : -1;
    const items = callback(state, index);

    await browser.storage.local.set({ workflowState: items });

    return items;
  } catch (error) {
    console.error(error);

    return [];
  }
}

class WorkflowState {
  static async get(filter) {
    try {
      let { workflowState } = await browser.storage.local.get('workflowState');

      if (workflowState && filter) {
        workflowState = workflowState.filter(filter);
      }

      return workflowState || [];
    } catch (error) {
      console.error(error);

      return [];
    }
  }

  static add(id, data) {
    return updater.call(this, (items) => {
      items.unshift({ id, ...data });

      return items;
    });
  }

  static update(id, data = {}) {
    return updater.call(
      this,
      (items, index) => {
        if (typeof index === 'number' && index !== -1) {
          items[index].state = { ...items[index].state, ...data };
        }

        return items;
      },
      id
    );
  }

  static delete(id) {
    return updater.call(
      this,
      (items, index) => {
        if (index !== -1) items.splice(index, 1);

        return items;
      },
      id
    );
  }
}

export default WorkflowState;

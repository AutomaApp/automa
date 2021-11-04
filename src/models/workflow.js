import { Model } from '@vuex-orm/core';
import { nanoid } from 'nanoid';
import browser from 'webextension-polyfill';
import Log from './log';

class Workflow extends Model {
  static entity = 'workflows';

  static primaryKey = 'id';

  static autoSave = true;

  static fields() {
    return {
      id: this.uid(() => nanoid()),
      name: this.string(''),
      icon: this.string('riGlobalLine'),
      data: this.attr(null),
      drawflow: this.string(''),
      dataColumns: this.attr([]),
      lastRunAt: this.number(),
      createdAt: this.number(),
      settings: this.attr({
        timeout: 120000,
        onError: 'stop-workflow',
      }),
      logs: this.hasMany(Log, 'workflowId'),
    };
  }

  static async insert(payload) {
    const res = await super.insert(payload);

    await this.store().dispatch('saveToStorage', 'workflows');

    return res;
  }

  static async afterDelete({ id }) {
    try {
      const { visitWebTriggers, shortcuts } = await browser.storage.local.get([
        'visitWebTriggers',
        'shortcuts',
      ]);
      const index = visitWebTriggers.findIndex((item) => item.id === id);

      if (index !== -1) {
        visitWebTriggers.splice(index, 1);
      }

      const keyboardShortcuts = shortcuts || {};
      delete keyboardShortcuts[id];

      await browser.storage.local.set({
        visitWebTriggers,
        shortcuts: keyboardShortcuts,
      });
      await browser.alarms.clear(id);
    } catch (error) {
      console.error(error);
    }
  }
}

export default Workflow;

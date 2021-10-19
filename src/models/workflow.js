import { Model } from '@vuex-orm/core';
import { nanoid } from 'nanoid';
import Task from './task';

class Workflow extends Model {
  static entity = 'workflows';

  static primaryKey = 'id';

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
      tasks: this.hasMany(Task, 'workflowId'),
    };
  }

  static async insert(payload) {
    const res = await super.insert(payload);

    await this.store().dispatch('saveToStorage', 'workflows');

    return res;
  }
}

export default Workflow;

import { Model } from '@vuex-orm/core';
import { nanoid } from 'nanoid';

class Task extends Model {
  static entity = 'tasks';

  static fields() {
    return {
      id: this.uid(() => nanoid()),
      name: this.string(''),
      description: this.string(''),
      type: this.string(''),
      createdAt: this.number(),
      data: this.attr(null),
      order: this.number(0),
      workflowId: this.attr(null),
    };
  }

  static async insert(payload) {
    const res = await super.insert(payload);

    await this.store().dispatch('saveToStorage', 'tasks');

    return res;
  }
}

export default Task;

import { Model } from '@vuex-orm/core';
import { nanoid } from 'nanoid';

class Task extends Model {
  static entity = 'tasks';

  static fields() {
    return {
      id: this.uid(() => nanoid()),
      description: this.string(''),
      type: this.string(''),
      data: this.attr(null),
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

import { Model } from '@vuex-orm/core';
import { nanoid } from 'nanoid';

class Task extends Model {
  static entity = 'tasks';

  static fields() {
    return {
      id: this.uid(() => nanoid()),
      name: this.string(''),
      type: this.string(''),
      createdAt: this.number(),
      workflowId: this.attr(null),
    };
  }

  static async insert(payload) {
    const res = await super.insert(payload);

    console.log(payload);

    return res;
  }
}

export default Task;

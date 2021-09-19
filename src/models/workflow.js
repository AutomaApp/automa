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
      data: this.attr(null),
      tasks: this.hasMany(Task, 'workflowId'),
    };
  }
}

export default Workflow;

import { Model } from '@vuex-orm/core';
import { nanoid } from 'nanoid';

class Log extends Model {
  static entity = 'logs';

  static fields() {
    return {
      id: this.uid(() => nanoid()),
      data: this.attr({}),
      name: this.string(''),
      history: this.attr([]),
      endedAt: this.number(0),
      startedAt: this.number(0),
      workflowId: this.attr(null),
      status: this.string('success'),
      icon: this.string('riGlobalLine'),
    };
  }
}

export default Log;

import { Model } from '@vuex-orm/core';
import { nanoid } from 'nanoid';
import browser from 'webextension-polyfill';

class Log extends Model {
  static entity = 'logs';

  static fields() {
    return {
      id: this.uid(() => nanoid()),
      data: this.attr({}),
      name: this.string(''),
      history: this.attr([]),
      endedAt: this.number(0),
      message: this.string(''),
      startedAt: this.number(0),
      parentLog: this.attr(null),
      workflowId: this.attr(null),
      collectionId: this.attr(null),
      status: this.string('success'),
      isChildLog: this.boolean(false),
      collectionLogId: this.attr(null),
      icon: this.string('riGlobalLine'),
      isInCollection: this.boolean(false),
    };
  }

  static afterDelete(item) {
    const logs = this.query().where('collectionLogId', item.id).get();

    browser.storage.local.get('logsCtxData').then((data) => {
      const logsCtxData = data.logsCtxData || {};

      delete logsCtxData[item.id];

      browser.storage.local.set({ logsCtxData });
    });

    if (logs.length !== 0) {
      Promise.allSettled(logs.map(({ id }) => this.delete(id))).then(() => {
        this.store().dispatch('saveToStorage', 'workflows');
      });
    }
  }
}

export default Log;

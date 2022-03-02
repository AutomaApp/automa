import { Model } from '@vuex-orm/core';
import { nanoid } from 'nanoid';
import browser from 'webextension-polyfill';
import Log from './log';
import { cleanWorkflowTriggers } from '@/utils/workflow-trigger';
import { fetchApi } from '@/utils/api';
import decryptFlow, { getWorkflowPass } from '@/utils/decrypt-flow';

class Workflow extends Model {
  static entity = 'workflows';

  static primaryKey = 'id';

  static autoSave = true;

  static fields() {
    return {
      __id: this.attr(null),
      id: this.uid(() => nanoid()),
      name: this.string(''),
      icon: this.string('riGlobalLine'),
      data: this.attr(null),
      drawflow: this.attr(''),
      table: this.attr([]),
      dataColumns: this.attr([]),
      description: this.string(''),
      pass: this.string(''),
      trigger: this.attr(null),
      version: this.string(''),
      createdAt: this.number(Date.now()),
      isDisabled: this.boolean(false),
      isProtected: this.boolean(false),
      settings: this.attr({
        blockDelay: 0,
        saveLog: true,
        debugMode: false,
        restartTimes: 3,
        onError: 'stop-workflow',
        executedBlockOnWeb: false,
      }),
      logs: this.hasMany(Log, 'workflowId'),
      globalData: this.string('[{ "key": "value" }]'),
    };
  }

  static beforeCreate(model) {
    if (model.dataColumns.length > 0) {
      model.table = model.dataColumns;
      model.dataColumns = [];
    }
    if (model.isProtected) {
      const pass = getWorkflowPass(model.pass);

      model.drawflow = decryptFlow(model, pass);
      model.isProtected = false;
    }
    if (model.table && !model.table[0]?.id) {
      model.table = model.table.map((column) => {
        if (!column.id) column.id = column.name;

        return column;
      });
    }

    return model;
  }

  static async insert(payload) {
    const res = await super.insert(payload);

    await this.store().dispatch('saveToStorage', 'workflows');

    return res;
  }

  static async afterDelete({ id }) {
    try {
      await cleanWorkflowTriggers(id);
      const hostedWorkflow = this.store().state.hostWorkflows[id];
      const { backupIds } = await browser.storage.local.get('backupIds');
      const isBackup = (backupIds || []).includes(id);

      if (hostedWorkflow || isBackup) {
        const response = await fetchApi(`/me/workflows?id=${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(response.statusText);
        }

        if (isBackup) {
          backupIds.splice(backupIds.indexOf(id), 1);
          await browser.storage.local.set({ backupIds });
        }

        await browser.storage.local.set({ clearCache: true });
      }
    } catch (error) {
      console.error(error);
    }
  }
}

export default Workflow;

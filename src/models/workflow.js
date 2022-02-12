import { Model } from '@vuex-orm/core';
import { nanoid } from 'nanoid';
import Log from './log';
import { cleanWorkflowTriggers } from '@/utils/workflow-trigger';
import { fetchApi } from '@/utils/api';

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

      try {
        const hostedWorkflow = this.store().state.hostWorkflows[id];

        if (hostedWorkflow) {
          const response = await fetchApi(
            `/me/workflows/host?id=${hostedWorkflow.hostId}`,
            {
              method: 'DELETE',
            }
          );

          if (response.status !== 200) {
            throw new Error(response.statusText);
          }
        }
      } catch (error) {
        console.error(error);
      }
      /* delete host workflow */
    } catch (error) {
      console.error(error);
    }
  }
}

export default Workflow;

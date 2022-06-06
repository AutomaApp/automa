import { Model } from '@vuex-orm/core';
import { nanoid } from 'nanoid';
import Workflow from './workflow';

class Folder extends Model {
  static entity = 'folders';

  static primaryKey = 'id';

  static autoSave = true;

  static fields() {
    return {
      id: this.uid(() => nanoid()),
      name: this.string(''),
      createdAt: this.number(),
      workflows: this.hasMany(Workflow, 'folderId'),
    };
  }

  static async insert(payload) {
    const res = await super.insert(payload);

    await this.store().dispatch('saveToStorage', 'folders');

    return res;
  }
}

export default Folder;

import { Model } from '@vuex-orm/core';
import { nanoid } from 'nanoid';

class Collection extends Model {
  static entity = 'collections';

  static primaryKey = 'id';

  static autoSave = true;

  static fields() {
    return {
      id: this.uid(() => nanoid()),
      name: this.string(''),
      flow: this.attr([]),
      createdAt: this.number(),
    };
  }

  static async insert(payload) {
    const res = await super.insert(payload);

    await this.store().dispatch('saveToStorage', 'collections');

    return res;
  }
}

export default Collection;

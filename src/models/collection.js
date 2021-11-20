import { Model } from '@vuex-orm/core';
import { nanoid } from 'nanoid';

class Collection extends Model {
  static entity = 'collections';

  static primaryKey = 'id';

  static autoSave = true;

  static fields() {
    return {
      id: this.uid(() => nanoid()),
      flow: this.attr([]),
      name: this.string(''),
      createdAt: this.number(),
      globalData: this.string(''),
      options: this.attr({
        atOnce: false,
      }),
    };
  }

  static async insert(payload) {
    const res = await super.insert(payload);

    await this.store().dispatch('saveToStorage', 'collections');

    return res;
  }
}

export default Collection;

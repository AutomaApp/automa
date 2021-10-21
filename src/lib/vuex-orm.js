import VuexORM, { Query } from '@vuex-orm/core';

function callback(model, param, entity) {
  if (this.baseModel.autoSave) {
    this.store.dispatch('saveToStorage', entity);
  }
}

Query.on('afterUpdate', callback);
Query.on('afterDelete', callback);

const database = new VuexORM.Database();

export default function (models) {
  Object.values(models).forEach((model) => {
    database.register(model);
  });

  return VuexORM.install(database);
}

import Dexie from 'dexie';

const dbStorage = new Dexie('storage');
dbStorage.version(1).stores({
  tablesData: '++id, tableId',
  tablesItems: '++id, name, createdAt, modifiedAt',
  variables: '++id, &name',
});

export default dbStorage;

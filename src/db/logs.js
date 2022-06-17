import Dexie from 'dexie';

const dbLogs = new Dexie('logs');
dbLogs.version(1).stores({
  ctxData: '++id, logId',
  logsData: '++id, logId',
  histories: '++id, logId',
  items: '++id, name, endedAt, workflowId, status, collectionId',
});

export const defaultLogItem = {
  name: '',
  endedAt: 0,
  message: '',
  startedAt: 0,
  parentLog: null,
  workflowId: null,
  status: 'success',
  collectionId: null,
};

export default dbLogs;

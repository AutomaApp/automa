import dbLogs, { defaultLogItem } from '@/db/logs';
/* eslint-disable class-methods-use-this */
class WorkflowLogger {
  constructor({ key = 'logs' }) {
    this.key = key;
  }

  async add({ detail, history, ctxData, data }) {
    const logDetail = { ...defaultLogItem, ...detail };

    await Promise.all([
      dbLogs.logsData.add(data),
      dbLogs.ctxData.add(ctxData),
      dbLogs.items.add(logDetail),
      dbLogs.histories.add(history),
    ]);
  }
}

export default WorkflowLogger;

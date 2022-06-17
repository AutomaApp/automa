import browser from 'webextension-polyfill';
import dbLogs from '@/db/logs';

export default async function () {
  try {
    const { logs, logsCtxData, migration } = await browser.storage.local.get([
      'logs',
      'migration',
      'logsCtxData',
    ]);
    const hasMigrated = migration || {};
    const backupData = {};

    if (!hasMigrated.logs && logs) {
      const ids = new Set();

      const items = [];
      const ctxData = [];
      const logsData = [];
      const histories = [];

      for (let index = logs.length - 1; index > 0; index -= 1) {
        const { data, history, ...item } = logs[index];
        const logId = item.id;

        if (!ids.has(logId) && ids.size < 500) {
          items.push(item);
          logsData.push({ logId, data });
          histories.push({ logId, data: history });
          ctxData.push({ logId, data: logsCtxData[logId] });

          ids.add(logId);
        }
      }

      await Promise.all([
        dbLogs.items.bulkAdd(items),
        dbLogs.ctxData.bulkAdd(ctxData),
        dbLogs.logsData.bulkAdd(logsData),
        dbLogs.histories.bulkAdd(histories),
      ]);

      backupData.logs = logs;
      hasMigrated.logs = true;

      await browser.storage.local.remove('logs');
    }

    await browser.storage.local.set({
      migration: hasMigrated,
      ...backupData,
    });
  } catch (error) {
    console.error(error);
  }
}

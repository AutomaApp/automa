import browser from 'webextension-polyfill';
import dbLogs from '@/db/logs';

export default async function () {
  try {
    const { logs, logsCtxData, migration } = await browser.storage.local.get([
      'logs',
      'logsCtxData',
    ]);
    const hasMigrated = migration || {};

    if (!hasMigrated.logs) {
      const ids = new Set();

      const items = [];
      const ctxData = [];
      const logsData = [];
      const histories = [];

      for (let index = 0; index < logs.length; index += 1) {
        const { data, history, ...item } = logs[index];
        const logId = item.id;

        if (!ids.has(logId)) {
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

      hasMigrated.logs = true;
    }

    await browser.storage.local.set({
      migration: hasMigrated,
    });
  } catch (error) {
    console.error(error);
  }
}

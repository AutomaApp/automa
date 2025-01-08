import cronParser from 'cron-parser';
import dayjs from 'dayjs';
import browser from 'webextension-polyfill';
import { isObject } from './helper';

export function registerContextMenu(triggerId, data) {
  return new Promise((resolve, reject) => {
    const documentUrlPatterns = ['https://*/*', 'http://*/*'];
    const contextTypes =
      !data.contextTypes || data.contextTypes.length === 0
        ? ['all']
        : data.contextTypes;

    const isFirefox = BROWSER_TYPE === 'firefox';
    const browserContext = isFirefox ? browser.menus : browser.contextMenus;

    if (!browserContext) {
      resolve();
      return;
    }

    const workflowId = triggerId.includes(':')
      ? triggerId.split(':')[1]
      : triggerId;

    browserContext.create(
      {
        id: workflowId,
        documentUrlPatterns,
        contexts: contextTypes,
        title: data.contextMenuName,
        parentId: 'automaContextMenu',
      },
      () => {
        const error = browser.runtime.lastError;
        if (error) {
          if (error.message.includes('automaContextMenu')) {
            browserContext.create(
              {
                documentUrlPatterns,
                contexts: ['all'],
                id: 'automaContextMenu',
                title: 'Run Automa workflow',
              },
              () => {
                registerContextMenu(workflowId, data)
                  .then(resolve)
                  .catch(reject);
              }
            );
            resolve();
            return;
          }
          if (error.message.includes('Duplicate id')) {
            browserContext.remove(triggerId).then(() => {
              registerContextMenu(workflowId, data).then(resolve).catch(reject);
            });
            return;
          }

          reject(error.message);
        } else {
          if (browserContext.refresh) browserContext.refresh();
          resolve();
        }
      }
    );
  });
}

async function removeFromWorkflowQueue(workflowId) {
  const { workflowQueue } = await browser.storage.local.get('workflowQueue');
  const queueIndex = (workflowQueue || []).findIndex((id) =>
    id.includes(workflowId)
  );

  if (!workflowQueue || queueIndex === -1) return;

  workflowQueue.splice(queueIndex, 1);

  await browser.storage.local.set({ workflowQueue });
}

export async function cleanWorkflowTriggers(workflowId, triggers) {
  try {
    const alarms = await browser.alarms.getAll();
    for (const alarm of alarms) {
      if (alarm.name.includes(workflowId)) {
        await browser.alarms.clear(alarm.name);
      }
    }

    const { visitWebTriggers, onStartupTriggers, shortcuts } =
      await browser.storage.local.get([
        'shortcuts',
        'visitWebTriggers',
        'onStartupTriggers',
      ]);

    const keyboardShortcuts = Array.isArray(shortcuts) ? {} : shortcuts || {};
    Object.keys(keyboardShortcuts).forEach((shortcutId) => {
      if (!shortcutId.includes(workflowId)) return;

      delete keyboardShortcuts[shortcutId];
    });

    const startupTriggers = (onStartupTriggers || []).filter(
      (id) => !id.includes(workflowId)
    );
    const filteredVisitWebTriggers = visitWebTriggers?.filter(
      (item) => !item.id.includes(workflowId)
    );

    await removeFromWorkflowQueue(workflowId);

    await browser.storage.local.set({
      shortcuts: keyboardShortcuts,
      onStartupTriggers: startupTriggers,
      visitWebTriggers: filteredVisitWebTriggers,
    });

    const browserContextMenu =
      BROWSER_TYPE === 'firefox' ? browser.menus : browser.contextMenus;
    const removeFromContextMenu = async () => {
      try {
        let promises = [];

        if (triggers) {
          promises = triggers.map(async (trigger) => {
            if (trigger.type !== 'context-menu') return;

            const triggerId = `trigger:${workflowId}:${trigger.id}`;
            await browserContextMenu.remove(triggerId);
          });
        }

        promises.push(browserContextMenu.remove(workflowId));

        await Promise.allSettled(promises);
      } catch (error) {
        // Do nothing
      }
    };
    if (browserContextMenu) await removeFromContextMenu();
  } catch (error) {
    console.error(error);
  }
}

export function registerSpecificDay(workflowId, data) {
  if (data.days.length === 0) return null;

  const getDate = (dayId, time) => {
    const [hour, minute, seconds] = time.split(':');
    const date = dayjs()
      .day(dayId)
      .hour(hour)
      .minute(minute)
      .second(seconds || 0);

    return date.valueOf();
  };

  const dates = data.days
    .reduce((acc, item) => {
      if (isObject(item)) {
        item.times.forEach((time) => {
          acc.push(getDate(item.id, time));
        });
      } else {
        acc.push(getDate(item, data.time));
      }

      return acc;
    }, [])
    .sort();

  const findDate =
    dates.find((date) => date > Date.now()) ||
    dayjs(dates[0]).add(7, 'day').valueOf();

  return browser.alarms.create(workflowId, {
    when: findDate,
  });
}

export function registerInterval(workflowId, data) {
  const alarmInfo = {
    periodInMinutes: data.interval,
  };

  if (data.delay > 0 && !data.fixedDelay) alarmInfo.delayInMinutes = data.delay;

  return browser.alarms.create(workflowId, alarmInfo);
}

export async function registerSpecificDate(workflowId, data) {
  let date = Date.now() + 60000;

  if (data.date) {
    const [hour, minute, second] = data.time.split(':');
    date = dayjs(data.date)
      .hour(hour)
      .minute(minute)
      .second(second || 0)
      .valueOf();
  }

  if (Date.now() > date) return;

  await browser.alarms.create(workflowId, {
    when: date,
  });
}

export async function registerVisitWeb(workflowId, data) {
  try {
    if (data.url.trim() === '') return;

    const visitWebTriggers =
      (await browser.storage.local.get('visitWebTriggers'))?.visitWebTriggers ||
      [];

    const index = visitWebTriggers.findIndex((item) => item.id === workflowId);
    const payload = {
      id: workflowId,
      url: data.url,
      isRegex: data.isUrlRegex,
      supportSPA: data.supportSPA ?? false,
    };

    if (index === -1) {
      visitWebTriggers.unshift(payload);
    } else {
      visitWebTriggers[index] = payload;
    }

    await browser.storage.local.set({ visitWebTriggers });
  } catch (error) {
    console.error(error);
  }
}

export async function registerKeyboardShortcut(workflowId, data) {
  try {
    const { shortcuts } = await browser.storage.local.get('shortcuts');
    const keyboardShortcuts = Array.isArray(shortcuts) ? {} : shortcuts || {};

    keyboardShortcuts[workflowId] = data.shortcut;

    await browser.storage.local.set({ shortcuts: keyboardShortcuts });
  } catch (error) {
    console.error(error);
  }
}

export async function registerOnStartup() {
  // Do nothing
}

export async function registerCronJob(workflowId, data) {
  try {
    const cronExpression = cronParser.parseExpression(data.expression);
    const nextSchedule = cronExpression.next();

    await browser.alarms.create(workflowId, { when: nextSchedule.getTime() });
  } catch (error) {
    console.error(error);
  }
}

export const workflowTriggersMap = {
  interval: registerInterval,
  date: registerSpecificDate,
  'cron-job': registerCronJob,
  'visit-web': registerVisitWeb,
  'on-startup': registerOnStartup,
  'specific-day': registerSpecificDay,
  'context-menu': registerContextMenu,
  'keyboard-shortcut': registerKeyboardShortcut,
};

export async function registerWorkflowTrigger(workflowId, { data }) {
  try {
    await cleanWorkflowTriggers(workflowId, data && data?.triggers);

    if (data.triggers) {
      for (const trigger of data.triggers) {
        const handler = workflowTriggersMap[trigger.type];
        if (handler)
          await handler(`trigger:${workflowId}:${trigger.id}`, trigger.data);
      }
    } else if (workflowTriggersMap[data.type]) {
      await workflowTriggersMap[data.type](workflowId, data);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export default {
  cleanUp: cleanWorkflowTriggers,
  register: registerWorkflowTrigger,
};

import browser from 'webextension-polyfill';
import dayjs from 'dayjs';
import { isObject } from './helper';

async function removeFromWorkflowQueue(workflowId) {
  const { workflowQueue } = await browser.storage.local.get('workflowQueue');
  const queueIndex = (workflowQueue || []).indexOf(workflowId);

  if (!workflowQueue || queueIndex === -1) return;

  workflowQueue.splice(queueIndex, 1);

  await browser.storage.local.set({ workflowQueue });
}

export async function cleanWorkflowTriggers(workflowId) {
  try {
    await browser.alarms.clear(workflowId);

    const { visitWebTriggers, onStartupTriggers, shortcuts } =
      await browser.storage.local.get([
        'shortcuts',
        'visitWebTriggers',
        'onStartupTriggers',
      ]);

    const keyboardShortcuts = Array.isArray(shortcuts) ? {} : shortcuts || {};
    delete keyboardShortcuts[workflowId];

    const startupTriggers = onStartupTriggers || [];
    const startupTriggerIndex = startupTriggers.indexOf(workflowId);
    if (startupTriggerIndex !== -1) {
      startupTriggers.splice(startupTriggerIndex, 1);
    }

    const visitWebTriggerIndex = visitWebTriggers.findIndex(
      (item) => item.id === workflowId
    );
    if (visitWebTriggerIndex !== -1) {
      visitWebTriggers.splice(visitWebTriggerIndex, 1);
    }

    await removeFromWorkflowQueue();

    await browser.storage.local.set({
      visitWebTriggers,
      shortcuts: keyboardShortcuts,
      onStartupTriggers: startupTriggers,
    });
  } catch (error) {
    console.error(error);
  }
}

export function registerSpecificDay(workflowId, data) {
  if (data.days.length === 0) return null;

  const getDate = (dayId, time) => {
    const [hour, minute] = time.split(':');
    const date = dayjs().day(dayId).hour(hour).minute(minute).second(0);

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

export function registerSpecificDate(workflowId, data) {
  let date = Date.now() + 60000;

  if (data.date) {
    const [hour, minute] = data.time.split(':');

    date = dayjs(data.date).hour(hour).minute(minute).second(0).valueOf();
  }

  return browser.alarms.create(workflowId, {
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

export async function registerWorkflowTrigger(workflowId, { data }) {
  try {
    await cleanWorkflowTriggers(workflowId);

    const triggersHandler = {
      interval: registerInterval,
      date: registerSpecificDate,
      'visit-web': registerVisitWeb,
      'on-startup': registerOnStartup,
      'specific-day': registerSpecificDay,
      'keyboard-shortcut': registerKeyboardShortcut,
    };

    if (triggersHandler[data.type])
      await triggersHandler[data.type](workflowId, data);
  } catch (error) {
    console.error(error);
  }
}

export default {
  cleanUp: cleanWorkflowTriggers,
  register: registerWorkflowTrigger,
};

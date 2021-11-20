import browser from 'webextension-polyfill';
import dayjs from 'dayjs';

export async function cleanWorkflowTriggers(workflowId) {
  try {
    await browser.alarms.clear(workflowId);

    const { visitWebTriggers, shortcuts } = await browser.storage.local.get([
      'visitWebTriggers',
      'shortcuts',
    ]);

    const keyboardShortcuts = Array.isArray(shortcuts) ? {} : shortcuts || {};
    delete keyboardShortcuts[workflowId];

    const visitWebTriggerIndex = visitWebTriggers.findIndex(
      (item) => item.id === workflowId
    );
    if (visitWebTriggerIndex !== -1) {
      visitWebTriggers.splice(visitWebTriggerIndex, 1);
    }

    await browser.storage.local.set({
      visitWebTriggers,
      shortcuts: keyboardShortcuts,
    });
  } catch (error) {
    console.error(error);
  }
}

export function registerSpecificDay(workflowId, data) {
  if (data.days.length === 0) return null;

  const [hour, minute] = data.time.split(':');
  const dates = data.days.map((id) =>
    dayjs().day(id).hour(hour).minute(minute)
  );
  const findDate =
    dates.find((date) => date.valueOf() > Date.now()) || dates[0].add(7, 'day');

  console.log(findDate.valueOf(), new Date(findDate.valueOf()));

  return browser.alarms.create(workflowId, {
    when: findDate.valueOf(),
  });
}

export function registerInterval(workflowId, data) {
  const alarmInfo = {
    periodInMinutes: data.interval,
  };

  if (data.delay > 0) alarmInfo.delayInMinutes = data.delay;

  return browser.alarms.create(workflowId, alarmInfo);
}

export function registerSpecificDate(workflowId, data) {
  let date = Date.now() + 60000;

  if (data.date) {
    const [hour, minute] = data.time.split(':');
    date = dayjs(data.data).hour(hour).minute(minute).valueOf();
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

export async function registerWorkflowTrigger(workflowId, { data }) {
  try {
    await cleanWorkflowTriggers(workflowId);

    const triggersHandler = {
      date: registerSpecificDate,
      interval: registerInterval,
      'visit-web': registerVisitWeb,
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

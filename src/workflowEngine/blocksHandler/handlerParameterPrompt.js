import { nanoid } from 'nanoid/non-secure';
import browser from 'webextension-polyfill';
import { sleep } from '@/utils/helper';

function getInputtedParams(promptId, ms = 10000) {
  return new Promise((resolve, reject) => {
    const timeout = null;

    const storageListener = (event) => {
      if (!event[promptId]) return;

      clearTimeout(timeout);
      browser.storage.onChanged.removeListener(storageListener);
      browser.storage.local.remove(promptId);

      const { newValue } = event[promptId];
      if (newValue.$isError) {
        reject(new Error(newValue.message));
        return;
      }

      resolve(newValue);
    };

    if (ms > 0) {
      setTimeout(() => {
        browser.storage.onChanged.removeListener(storageListener);
        resolve({});
      }, ms);
    }

    browser.storage.onChanged.addListener(storageListener);
  });
}

export default async function ({ data, id }) {
  const paramURL = browser.runtime.getURL('/params.html');
  let tab = (await browser.tabs.query({})).find((item) =>
    item.url.includes(paramURL)
  );

  if (!tab) {
    const { tabs } = await browser.windows.create({
      type: 'popup',
      width: 480,
      height: 600,
      url: browser.runtime.getURL('/params.html'),
    });
    [tab] = tabs;
    await sleep(1000);
  } else {
    await browser.tabs.update(tab.id, {
      active: true,
    });
    await browser.windows.update(tab.windowId, { focused: true });
  }

  const promptId = `params-prompt:${nanoid(4)}__${id}`;
  const { timeout } = data;

  await browser.tabs.sendMessage(tab.id, {
    name: 'workflow:params-block',
    data: {
      promptId,
      blockId: id,
      timeoutMs: timeout,
      execId: this.engine.id,
      params: data.parameters,
      timeout: Date.now() + timeout,
      name: this.engine.workflow.name,
      icon: this.engine.workflow.icon,
      description: this.engine.workflow.description,
    },
  });

  const result = await getInputtedParams(promptId, timeout);

  Object.entries(result).forEach(([varName, varValue]) => {
    this.setVariable(varName, varValue);
  });

  return {
    data: '',
    nextBlockId: this.getBlockConnections(id),
  };
}

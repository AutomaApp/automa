import browser from 'webextension-polyfill';
import { sleep } from '@/utils/helper';

function getInputtedParams({ execId, blockId }, ms) {
  return new Promise((resolve, reject) => {
    let timeout = null;
    const key = `params-prompt:${execId}__${blockId}`;

    const storageListener = (event) => {
      if (!event[key]) return;

      clearTimeout(timeout);
      browser.storage.onChanged.removeListener(storageListener);

      const { newValue } = event[key];
      if (newValue.$isError) {
        reject(new Error(newValue.message));
        return;
      }

      resolve(newValue);
    };

    timeout = setTimeout(() => {
      browser.storage.onChanged.removeListener(storageListener);
      resolve({});
    }, ms || 10000);

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

  const timeout = data.timeout || 20000;

  await browser.tabs.sendMessage(tab.id, {
    name: 'workflow:params-block',
    data: {
      blockId: id,
      execId: this.engine.id,
      params: data.parameters,
      timeout: Date.now() + timeout,
      name: this.engine.workflow.name,
      icon: this.engine.workflow.icon,
      description: this.engine.workflow.description,
    },
  });

  const result = await getInputtedParams(
    {
      blockId: id,
      execId: this.engine.id,
    },
    timeout
  );
  console.log(result);
  Object.entries(result).forEach(([varName, varValue]) => {
    this.setVariable(varName, varValue);
  });

  return {
    data: '',
    nextBlockId: this.getBlockConnections(id),
  };
}

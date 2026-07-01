import BrowserAPIService from '@/service/browser-api/BrowserAPIService';
import { sleep } from '@/utils/helper';
import { MessageListener } from '@/utils/message';
import { nanoid } from 'nanoid/non-secure';
import renderString from '../templating/renderString';

function getInputtedParams(promptId, ms = 10000) {
  return new Promise((resolve, reject) => {
    const timeout = null;

    const storageListener = (event) => {
      if (!event[promptId]) return;

      clearTimeout(timeout);
      BrowserAPIService.storage.onChanged.removeListener(storageListener);
      BrowserAPIService.storage.local.remove(promptId);

      const { newValue } = event[promptId];
      if (newValue.$isError) {
        reject(new Error(newValue.message));
        return;
      }

      resolve(newValue);
    };

    if (ms > 0) {
      setTimeout(() => {
        BrowserAPIService.storage.onChanged.removeListener(storageListener);
        resolve({});
      }, ms);
    }

    BrowserAPIService.storage.onChanged.addListener(storageListener);
  });
}

async function renderParamValue(param, refData, isPopup) {
  const renderedVals = {};

  const keys = ['defaultValue', 'description', 'placeholder'];
  await Promise.allSettled(
    keys.map(async (key) => {
      if (!param[key]) return;
      renderedVals[key] = (
        await renderString(param[key], refData, isPopup)
      ).value;
    })
  );

  return { ...param, ...renderedVals };
}

export default async function ({ data, id }, { refData }) {
  const paramURL = BrowserAPIService.runtime.getURL('/params.html');

  let tabs;
  try {
    tabs = await BrowserAPIService.tabs.query({});
  } catch (e) {
    console.error('Local tabs.query failed, trying background:', e.message);
  }

  if (!tabs || !Array.isArray(tabs)) {
    try {
      tabs = await MessageListener.sendMessage(
        'browser-api',
        { name: 'tabs.query', args: [{}] },
        'background'
      );
    } catch (e) {
      console.error('Background tabs.query also failed:', e.message);
      tabs = [];
    }
  }

  let tab = tabs.find((item) => item.url?.includes(paramURL));

  if (!tab) {
    const { tabs: newTabs } = await BrowserAPIService.windows.create({
      type: 'popup',
      width: 480,
      height: 600,
      url: BrowserAPIService.runtime.getURL('/params.html'),
    });
    [tab] = newTabs;
    await sleep(1000);
  } else {
    await BrowserAPIService.tabs.update(tab.id, {
      active: true,
    });
    await BrowserAPIService.windows.update(tab.windowId, { focused: true });
  }

  const promptId = `params-prompt:${nanoid(4)}__${id}`;
  const { timeout } = data;

  const params = await Promise.all(
    data.parameters.map((item) =>
      renderParamValue(item, refData, this.engine.isPopup)
    )
  );

  await BrowserAPIService.tabs.sendMessage(tab.id, {
    name: 'workflow:params-block',
    data: {
      params,
      promptId,
      blockId: id,
      timeoutMs: timeout,
      execId: this.engine.id,
      timeout: Date.now() + timeout,
      name: this.engine.workflow.name,
      icon: this.engine.workflow.icon,
      description: this.engine.workflow.description,
    },
  });

  const result = await getInputtedParams(promptId, timeout);

  await Promise.allSettled(
    Object.entries(result).map(async ([varName, varValue]) =>
      this.setVariable(varName, varValue)
    )
  );

  return {
    data: '',
    nextBlockId: this.getBlockConnections(id),
  };
}

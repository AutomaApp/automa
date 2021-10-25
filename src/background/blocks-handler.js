/* eslint-disable no-underscore-dangle */
import browser from 'webextension-polyfill';
import { objectHasKey, fileSaver } from '@/utils/helper';
import { tasks } from '@/utils/shared';
import dataExporter from '@/utils/data-exporter';
import compareBlockValue from '@/utils/compare-block-value';
import errorMessage from './error-message';

function getBlockConnection(block, index = 1) {
  const blockId = block.outputs[`output_${index}`]?.connections[0]?.node;

  return blockId;
}
function convertData(data, type) {
  let result = data;

  switch (type) {
    case 'integer':
      result = +data.replace(/\D+/g, '');
      break;
    case 'boolean':
      result = Boolean(data);
      break;
    default:
  }

  return result;
}
function generateBlockError(block) {
  const message = errorMessage('no-tab', tasks[block.name]);
  const error = new Error(message);
  error.nextBlockId = getBlockConnection(block);

  return error;
}

export async function closeTab(block) {
  const nextBlockId = getBlockConnection(block);

  try {
    const { data } = block;
    let tabIds;

    if (data.activeTab && this.tabId) {
      tabIds = this.tabId;
    } else if (data.url) {
      tabIds = (await browser.tabs.query({ url: data.url })).map(
        (tab) => tab.id
      );
    }

    if (tabIds) await browser.tabs.remove(tabIds);

    return {
      nextBlockId,
      data: '',
    };
  } catch (error) {
    const errorInstance = typeof error === 'string' ? new Error(error) : error;
    errorInstance.nextBlockId = nextBlockId;

    throw error;
  }
}
export async function trigger(block) {
  const nextBlockId = getBlockConnection(block);
  try {
    if (block.data.type === 'visit-web' && this.tabId) {
      await browser.tabs.executeScript(this.tabId, {
        file: './contentScript.bundle.js',
      });

      this._connectTab(this.tabId);
    }

    return { nextBlockId, data: '' };
  } catch (error) {
    const errorInstance = new Error(error);
    errorInstance.nextBlockId = nextBlockId;

    throw errorInstance;
  }
}

export function goBack(block) {
  return new Promise((resolve, reject) => {
    const nextBlockId = getBlockConnection(block);

    if (!this.tabId) {
      reject(generateBlockError(block));

      return;
    }

    browser.tabs
      .goBack(this.tabId)
      .then(() => {
        resolve({
          nextBlockId,
          data: '',
        });
      })
      .catch((error) => {
        error.nextBlockId = nextBlockId;
        reject(error);
      });
  });
}

export function forwardPage(block) {
  return new Promise((resolve, reject) => {
    const nextBlockId = getBlockConnection(block);

    if (!this.tabId) {
      reject(generateBlockError(block));

      return;
    }

    browser.tabs
      .goForward(this.tabId)
      .then(() => {
        resolve({
          nextBlockId,
          data: '',
        });
      })
      .catch((error) => {
        error.nextBlockId = nextBlockId;
        reject(error);
      });
  });
}

export function newTab(block) {
  return new Promise((resolve, reject) => {
    browser.tabs
      .create(block.data)
      .then((tab) => {
        this._listener({
          name: 'tab-updated',
          id: tab.id,
          once: true,
          callback: async (tabId, changeInfo, deleteListener) => {
            if (changeInfo.status !== 'complete') return;

            try {
              await browser.tabs.executeScript(tabId, {
                file: './contentScript.bundle.js',
              });

              this.tabId = tabId;
              this._connectTab(tabId);

              deleteListener();

              resolve({
                nextBlockId: getBlockConnection(block),
                data: block.data.url,
              });
            } catch (error) {
              console.error(error);
            }
          },
        });
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
}

export async function activeTab(block) {
  const nextBlockId = getBlockConnection(block);

  try {
    const data = {
      nextBlockId,
      data: '',
    };

    if (this.tabId) {
      await browser.tabs.update(this.tabId, { active: true });

      return data;
    }

    const [tab] = await browser.tabs.query({ active: true });

    await browser.tabs.executeScript(tab.id, {
      file: './contentScript.bundle.js',
    });

    this.tabId = tab.id;
    this._connectTab(tab.id);

    return data;
  } catch (error) {
    console.error(error);
    return {
      data: '',
      nextBlockId,
    };
  }
}

export async function takeScreenshot(block) {
  const nextBlockId = getBlockConnection(block);
  const { ext, quality, captureActiveTab, fileName } = block.data;

  function saveImage(uri) {
    const image = new Image();

    image.onload = () => {
      const name = `${fileName || 'Screenshot'}.${ext || 'png'}`;
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;

      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);

      fileSaver(name, canvas.toDataURL());
    };

    image.src = uri;
  }

  try {
    const options = {
      quality,
      format: ext || 'png',
    };

    if (captureActiveTab) {
      if (!this.tabId) {
        throw new Error(errorMessage('no-tab', block));
      }

      const [tab] = await browser.tabs.query({ active: true });

      await browser.tabs.update(this.tabId, { active: true });

      setTimeout(() => {
        browser.tabs.captureVisibleTab(options).then((uri) => {
          browser.tabs.update(tab.id, { active: true });
          saveImage(uri);
        });
      }, 500);
    } else {
      const uri = await browser.tabs.captureVisibleTab(options);

      saveImage(uri);
    }

    return { data: '', nextBlockId };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

export function interactionHandler(block) {
  return new Promise((resolve, reject) => {
    const nextBlockId = getBlockConnection(block);

    if (!this.connectedTab) {
      reject(generateBlockError(block));

      return;
    }

    this.connectedTab.postMessage({ isBlock: true, ...block });
    this._listener({
      name: 'tab-message',
      id: block.name,
      once: true,
      delay: block.name === 'link' ? 5000 : 0,
      callback: (data) => {
        if (objectHasKey(block.data, 'dataColumn')) {
          const { name, type } = Object.values(this.workflow.dataColumns).find(
            (item) => item.name === block.data.dataColumn
          ) || { name: 'column', type: 'text' };

          if (block.data.saveData) {
            if (!objectHasKey(this.data, name)) this.data[name] = [];

            if (Array.isArray(data)) {
              data.forEach((item) => {
                this.data[name].push(convertData(item, type));
              });
            } else {
              this.data[name].push(convertData(data, type));
            }
          }
        }

        resolve({
          data,
          nextBlockId,
        });
      },
    });
  });
}

export function delay(block) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        nextBlockId: getBlockConnection(block),
        data: '',
      });
    }, block.data.time);
  });
}

export function exportData(block) {
  return new Promise((resolve) => {
    dataExporter(this.data, block.data);

    resolve({
      data: '',
      nextBlockId: getBlockConnection(block),
    });
  });
}

export function elementExists(block) {
  return new Promise((resolve, reject) => {
    if (!this.connectedTab) {
      reject(generateBlockError(block));

      return;
    }

    this.connectedTab.postMessage({ isBlock: true, ...block });
    this._listener({
      name: 'tab-message',
      id: block.name,
      once: true,
      callback: (data) => {
        resolve({
          data,
          nextBlockId: getBlockConnection(block, data ? 1 : 2),
        });
      },
    });
  });
}

export function conditions({ data, outputs }, prevBlockData) {
  return new Promise((resolve, reject) => {
    if (data.conditions.length === 0) {
      reject(new Error('Conditions is empty'));
      return;
    }

    let outputIndex = data.conditions.length + 1;
    let resultData = '';
    const prevData = Array.isArray(prevBlockData)
      ? prevBlockData[0]
      : prevBlockData;

    data.conditions.forEach(({ type, value }, index) => {
      const result = compareBlockValue(type, prevData, value);

      if (result) {
        resultData = value;
        outputIndex = index + 1;
      }
    });

    resolve({
      data: resultData,
      nextBlockId: getBlockConnection({ outputs }, outputIndex),
    });
  });
}

export function repeatTask({ data, id, outputs }) {
  return new Promise((resolve) => {
    if (this.repeatedTasks[id] === data.repeatFor) {
      resolve({
        data: data.repeatFor,
        nextBlockId: getBlockConnection({ outputs }),
      });
    } else {
      this.repeatedTasks[id] = (this.repeatedTasks[id] || 0) + 1;

      resolve({
        data: data.repeatFor,
        nextBlockId: getBlockConnection({ outputs }, 2),
      });
    }
  });
}

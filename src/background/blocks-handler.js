/* eslint-disable no-underscore-dangle */
import browser from 'webextension-polyfill';
import { objectHasKey } from '@/utils/helper';
import dataExporter from '@/utils/data-exporter';

function getBlockConnection(block, index = 1) {
  const blockId = block.outputs[`output_${index}`].connections[0]?.node;

  return blockId;
}
function converData(data, type) {
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

export function trigger(block) {
  return new Promise((resolve) => {
    const nextBlockId = getBlockConnection(block);

    resolve({ nextBlockId, data: '' });
  });
}

export function openWebsite(block) {
  return new Promise((resolve, reject) => {
    browser.tabs
      .create({
        active: true,
        url: block.data.url,
      })
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
        console.error(error, 'nnnaa');
        reject(error);
      });
  });
}

export function interactionHandler(block) {
  return new Promise((resolve) => {
    if (!this._connectedTab) return;

    this._connectedTab.postMessage(block);
    this._listener({
      name: 'tab-message',
      id: block.name,
      once: true,
      delay: block.name === 'link' ? 5000 : 0,
      callback: (data) => {
        if (objectHasKey(block.data, 'dataColumn')) {
          const column =
            Object.values(this.workflow.dataColumns).find(
              ({ name }) => name === block.data.dataColumn
            ) ?? {};
          const name = column.name || 'column';
          console.log(column, converData(data, column.type));
          (this.data[name] = this.data[name] || []).push(
            converData(data, column.type)
          );
        }

        resolve({
          data,
          nextBlockId: getBlockConnection(block),
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
    dataExporter(this.data, block.data.type);

    resolve({
      data: '',
      nextBlockId: getBlockConnection(block),
    });
  });
}

import { objectHasKey, isObject } from '@/utils/helper';
import { getBlockConnection, convertData } from '../helper';

async function interactionHandler(block, prevBlockData) {
  const nextBlockId = getBlockConnection(block);

  try {
    const refData = {
      prevBlockData,
      dataColumns: this.data,
      loopData: this.loopData,
      globalData: this.globalData,
      activeTabUrl: this.activeTabUrl,
    };
    const data = await this._sendMessageToTab(
      { ...block, refData },
      {
        frameId: this.frameId || 0,
      }
    );

    if (block.name === 'link')
      await new Promise((resolve) => setTimeout(resolve, 5000));

    if (data?.isError) {
      const error = new Error(data.message);
      error.nextBlockId = nextBlockId;

      throw error;
    }

    const getColumn = (name) =>
      this.workflow.dataColumns.find((item) => item.name === name) || {
        name: 'column',
        type: 'text',
      };
    const pushData = (column, value) => {
      this.data[column.name]?.push(convertData(value, column.type));
    };

    if (objectHasKey(block.data, 'dataColumn')) {
      const column = getColumn(block.data.dataColumn);

      if (block.data.saveData) {
        if (Array.isArray(data) && column.type !== 'array') {
          data.forEach((item) => {
            pushData(column, item);
          });
        } else {
          pushData(column, data);
        }
      }
    } else if (block.name === 'javascript-code') {
      const memoColumn = {};
      const pushObjectData = (obj) => {
        Object.entries(obj).forEach(([key, value]) => {
          let column;

          if (memoColumn[key]) {
            column = memoColumn[key];
          } else {
            const currentColumn = getColumn(key);

            column = currentColumn;
            memoColumn[key] = currentColumn;
          }

          pushData(column, value);
        });
      };

      if (Array.isArray(data)) {
        data.forEach((obj) => {
          if (isObject(obj)) pushObjectData(obj);
        });
      } else if (isObject(data)) {
        pushObjectData(data);
      }
    }

    return {
      data,
      nextBlockId,
    };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

export default interactionHandler;

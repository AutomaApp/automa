import { objectHasKey } from '@/utils/helper';
import { getBlockConnection } from '../helper';

async function interactionHandler(block, { refData }) {
  const nextBlockId = getBlockConnection(block);
  const messagePayload = { ...block, refData };

  try {
    const data = await this._sendMessageToTab(messagePayload, {
      frameId: this.frameId || 0,
    });

    if (block.name === 'link')
      await new Promise((resolve) => setTimeout(resolve, 5000));

    if (objectHasKey(block.data, 'dataColumn')) {
      if (!block.data.saveData)
        return {
          data,
          nextBlockId,
        };

      const currentColumnType =
        this.columns[block.data.dataColumn]?.type || 'any';

      if (Array.isArray(data) && currentColumnType !== 'array') {
        data.forEach((item) => {
          this.addData(block.data.dataColumn, item);
        });
      } else {
        this.addData(block.data.dataColumn, data);
      }
    } else if (block.name === 'javascript-code') {
      const arrData = Array.isArray(data) ? data : [data];

      this.addData(arrData);
    }

    return {
      data,
      nextBlockId,
    };
  } catch (error) {
    error.nextBlockId = nextBlockId;
    error.data = {
      name: block.name,
      selector: block.data.selector,
    };

    throw error;
  }
}

export default interactionHandler;

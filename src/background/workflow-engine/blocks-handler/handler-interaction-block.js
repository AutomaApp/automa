import { objectHasKey } from '@/utils/helper';
import { getBlockConnection } from '../helper';

async function interactionHandler(block, { refData }) {
  const nextBlockId = getBlockConnection(block);
  const messagePayload = {
    ...block,
    refData,
    frameSelector: this.frameSelector,
  };

  try {
    const data = await this._sendMessageToTab(messagePayload, {
      frameId: this.activeTab.frameId || 0,
    });

    if (block.name === 'link')
      await new Promise((resolve) => setTimeout(resolve, 5000));

    if (objectHasKey(block.data, 'dataColumn')) {
      const dontSaveData =
        (block.name === 'forms' && !block.data.getValue) ||
        !block.data.saveData;

      if (dontSaveData)
        return {
          data,
          nextBlockId,
        };

      const currentColumnType =
        this.columns[block.data.dataColumn]?.type || 'any';

      if (Array.isArray(data) && currentColumnType !== 'array') {
        data.forEach((item) => {
          this.addDataToColumn(block.data.dataColumn, item);
          if (objectHasKey(block.data, 'extraRowDataColumn')) {
            if (block.data.addExtraRow)
              this.addDataToColumn(
                block.data.extraRowDataColumn,
                block.data.extraRowValue
              );
          }
        });
      } else {
        this.addDataToColumn(block.data.dataColumn, data);
        if (objectHasKey(block.data, 'extraRowDataColumn')) {
          if (block.data.addExtraRow)
            this.addDataToColumn(
              block.data.extraRowDataColumn,
              block.data.extraRowValue
            );
        }
      }
    } else if (block.name === 'javascript-code') {
      const arrData = Array.isArray(data) ? data : [data];

      this.addDataToColumn(arrData);
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

import { parseJSON } from '@/utils/helper';
import { getBlockConnection } from '../helper';

async function loopData({ data, id, outputs }) {
  const nextBlockId = getBlockConnection({ outputs });

  try {
    if (this.loopList[data.loopId]) {
      const index = this.loopList[data.loopId].index + 1;

      this.loopList[data.loopId].index = index;

      let currentLoopData;

      if (data.loopThrough === 'numbers') {
        currentLoopData = this.referenceData.loopData[data.loopId].data + 1;
      } else {
        currentLoopData = this.loopList[data.loopId].data[index];
      }

      this.referenceData.loopData[data.loopId] = {
        data: currentLoopData,
        $index: index,
      };
    } else {
      const getLoopData = {
        numbers: () => data.fromNumber,
        table: () => this.referenceData.table,
        'custom-data': () => JSON.parse(data.loopData),
        'data-columns': () => this.referenceData.table,
        'google-sheets': () =>
          this.referenceData.googleSheets[data.referenceKey],
        variable: () => {
          const variableVal = this.referenceData.variables[data.variableName];

          return parseJSON(variableVal, variableVal);
        },
        elements: async () => {
          const elements = await this._sendMessageToTab({
            blockId: id,
            isBlock: false,
            max: data.maxLoop,
            type: 'loop-elements',
            selector: data.elementSelector,
          });

          return elements;
        },
      };

      const currLoopData = await getLoopData[data.loopThrough]();
      let index = 0;

      if (data.loopThrough !== 'numbers') {
        if (!Array.isArray(currLoopData)) {
          throw new Error('invalid-loop-data');
        }

        if (data.resumeLastWorkflow) {
          index = JSON.parse(localStorage.getItem(`index:${id}`)) || 0;
        } else if (data.startIndex > 0) {
          index = data.startIndex;
        }
      }

      this.loopList[data.loopId] = {
        index,
        blockId: id,
        id: data.loopId,
        data: currLoopData,
        type: data.loopThrough,
        maxLoop:
          data.loopThrough === 'numbers'
            ? data.toNumber + 1 - data.fromNumber
            : data.maxLoop || currLoopData.length,
      };
      /* eslint-disable-next-line */
      this.referenceData.loopData[data.loopId] = {
        data:
          data.loopThrough === 'numbers'
            ? data.fromNumber
            : currLoopData[index],
        $index: index,
      };
    }

    localStorage.setItem(`index:${id}`, this.loopList[data.loopId].index);

    return {
      nextBlockId,
      data: this.referenceData.loopData[data.loopId],
    };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

export default loopData;

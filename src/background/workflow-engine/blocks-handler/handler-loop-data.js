import { getBlockConnection } from '../helper';
import { parseJSON } from '@/utils/helper';

function loopData(block) {
  return new Promise((resolve, reject) => {
    const { data } = block;
    const nextBlockId = getBlockConnection(block);

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
      let currLoopData;

      switch (data.loopThrough) {
        case 'numbers':
          currLoopData = data.fromNumber;
          break;
        case 'data-columns':
          currLoopData = this.referenceData.dataColumns;
          break;
        case 'google-sheets':
          currLoopData = this.referenceData.googleSheets[data.referenceKey];
          break;
        case 'custom-data':
          currLoopData = JSON.parse(data.loopData);
          break;
        case 'variable': {
          const variableVal = this.referenceData.variables[data.variableName];
          currLoopData = parseJSON(variableVal, variableVal);
          break;
        }
        default:
      }

      if (data.loopThrough !== 'numbers' && !Array.isArray(currLoopData)) {
        const error = new Error('invalid-loop-data');
        error.nextBlockId = nextBlockId;

        reject(error);
        return;
      }

      this.loopList[data.loopId] = {
        index: 0,
        data: currLoopData,
        id: data.loopId,
        blockId: block.id,
        type: data.loopThrough,
        maxLoop:
          data.loopThrough === 'numbers'
            ? data.toNumber + 1 - data.fromNumber
            : data.maxLoop || currLoopData.length,
      };
      /* eslint-disable-next-line */
      this.referenceData.loopData[data.loopId] = {
        data:
          data.loopThrough === 'numbers' ? data.fromNumber : currLoopData[0],
        $index: 0,
      };
    }

    resolve({
      nextBlockId,
      data: this.referenceData.loopData[data.loopId],
    });
  });
}

export default loopData;

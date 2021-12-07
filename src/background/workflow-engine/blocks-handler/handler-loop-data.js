import { generateJSON } from '@/utils/data-exporter';
import { getBlockConnection } from '../helper';

function loopData(block) {
  return new Promise((resolve) => {
    const { data } = block;

    if (this.loopList[data.loopId]) {
      this.loopList[data.loopId].index += 1;

      let currentLoopData;

      if (data.loopThrough === 'numbers') {
        currentLoopData = this.loopData[data.loopId] + 1;
      } else {
        currentLoopData =
          this.loopList[data.loopId].data[this.loopList[data.loopId].index];
      }

      this.loopData[data.loopId] = currentLoopData;
    } else {
      let currLoopData;

      switch (data.loopThrough) {
        case 'numbers':
          currLoopData = data.fromNumber;
          break;
        case 'data-columns':
          currLoopData = generateJSON(Object.keys(this.data), this.data);
          break;
        case 'custom-data':
          currLoopData = JSON.parse(data.loopData);
          break;
        default:
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
      this.loopData[data.loopId] = data.loopThrough === 'numbers' ? data.fromNumber : currLoopData[0];

      console.log(this.loopList, this.loopData);
    }

    resolve({
      data: this.loopData[data.loopId],
      nextBlockId: getBlockConnection(block),
    });
  });
}

export default loopData;

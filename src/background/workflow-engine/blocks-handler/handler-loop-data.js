import { generateJSON } from '@/utils/data-exporter';
import { getBlockConnection } from '../helper';

function loopData(block) {
  return new Promise((resolve) => {
    const { data } = block;

    if (this.loopList[data.loopId]) {
      this.loopList[data.loopId].index += 1;
      this.loopData[data.loopId] =
        this.loopList[data.loopId].data[this.loopList[data.loopId].index];
    } else {
      const currLoopData =
        data.loopThrough === 'data-columns'
          ? generateJSON(Object.keys(this.data), this.data)
          : JSON.parse(data.loopData);

      this.loopList[data.loopId] = {
        index: 0,
        data: currLoopData,
        id: data.loopId,
        blockId: block.id,
        maxLoop: data.maxLoop || currLoopData.length,
      };
      /* eslint-disable-next-line */
      this.loopData[data.loopId] = currLoopData[0];
    }

    resolve({
      data: this.loopData[data.loopId],
      nextBlockId: getBlockConnection(block),
    });
  });
}

export default loopData;

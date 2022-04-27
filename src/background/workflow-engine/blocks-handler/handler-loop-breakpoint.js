import { getBlockConnection } from '../helper';

function loopBreakpoint(block, { prevBlockData }) {
  const currentLoop = this.loopList[block.data.loopId];

  return new Promise((resolve) => {
    let validLoopData = false;

    if (currentLoop) {
      validLoopData =
        currentLoop.type === 'numbers'
          ? true
          : currentLoop.index <= currentLoop.data.length - 1;
    }

    if (
      currentLoop &&
      currentLoop.index < currentLoop.maxLoop - 1 &&
      validLoopData
    ) {
      resolve({
        data: '',
        nextBlockId: currentLoop.blockId,
      });
    } else {
      delete this.loopList[block.data.loopId];
      delete this.engine.referenceData.loopData[block.data.loopId];

      resolve({
        data: prevBlockData,
        nextBlockId: getBlockConnection(block),
      });
    }
  });
}

export default loopBreakpoint;

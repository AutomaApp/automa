import { getBlockConnection } from '../helper';

function loopBreakpoint(block, prevBlockData) {
  const currentLoop = this.loopList[block.data.loopId];
  return new Promise((resolve) => {
    if (
      currentLoop &&
      currentLoop.index < currentLoop.maxLoop - 1 &&
      currentLoop.index <= currentLoop.data.length - 1
    ) {
      resolve({
        data: '',
        nextBlockId: currentLoop.blockId,
      });
    } else {
      resolve({
        data: prevBlockData,
        nextBlockId: getBlockConnection(block),
      });
    }
  });
}

export default loopBreakpoint;

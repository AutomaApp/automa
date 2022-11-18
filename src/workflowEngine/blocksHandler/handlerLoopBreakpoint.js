import { waitTabLoaded } from '../helper';

async function loopBreakpoint(block, { prevBlockData }) {
  const currentLoop = this.loopList[block.data.loopId];

  let validLoopData = false;

  if (currentLoop) {
    validLoopData =
      currentLoop.type === 'numbers'
        ? true
        : currentLoop.index < currentLoop.data.length - 1;
  } else {
    throw new Error(`Can't find a loop with "${block.data.loopId}" loop id`);
  }

  const notReachMaxLoop =
    currentLoop && currentLoop.maxLoop > 0
      ? currentLoop.index < currentLoop.maxLoop - 1
      : true;
  if (!block.data.clearLoop && validLoopData && notReachMaxLoop) {
    return {
      data: '',
      nextBlockId: [{ id: currentLoop.blockId }],
    };
  }
  if (currentLoop.type === 'elements') {
    if (currentLoop.loadMoreAction && notReachMaxLoop) {
      const isClickLink = currentLoop.loadMoreAction.type === 'click-link';
      let result = await this._sendMessageToTab({
        id: currentLoop.blockId,
        label: 'loop-elements',
        data: {
          ...currentLoop.loadMoreAction,
          index: currentLoop.index,
          onlyClickLink: isClickLink,
        },
      });

      if (!result.continue && isClickLink) {
        await waitTabLoaded({
          tabId: this.activeTab.id,
          ms: currentLoop.loadMoreAction.actionPageMaxWaitTime * 1000,
        });
        result = await this._sendMessageToTab({
          id: currentLoop.blockId,
          label: 'loop-elements',
          data: {
            ...currentLoop.loadMoreAction,
            index: currentLoop.index,
          },
        });
      }

      if (!result.continue && result.length > 0) {
        this.loopList[block.data.loopId].data.push(...result);
        return {
          data: '',
          nextBlockId: [{ id: currentLoop.blockId }],
        };
      }
    }

    const loopElsIndex = this.loopEls.findIndex(
      ({ blockId }) => blockId === currentLoop.blockId
    );

    if (loopElsIndex !== -1) this.loopEls.splice(loopElsIndex, 1);
  }

  delete this.loopList[block.data.loopId];
  delete this.engine.referenceData.loopData[block.data.loopId];
  this.engine.addRefDataSnapshot('loopData');

  return {
    data: prevBlockData,
    nextBlockId: this.getBlockConnections(block.id),
  };
}

export default loopBreakpoint;

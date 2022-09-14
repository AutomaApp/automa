async function loopElements({ data, id }, { refData }) {
  try {
    if (!this.activeTab.id) throw new Error('no-tab');

    if (this.loopList[data.loopId]) {
      const index = this.loopList[data.loopId].index + 1;

      this.loopList[data.loopId].index = index;

      refData.loopData[data.loopId] = {
        $index: index,
        data: this.loopList[data.loopId].data[index],
      };
    } else {
      const maxLoop = +data.maxLoop || 0;
      const { elements, url, loopId } = await this._sendMessageToTab({
        id,
        label: 'loop-data',
        data: {
          max: maxLoop,
          multiple: true,
          ...data,
        },
      });
      this.loopEls.push({
        url,
        loopId,
        max: maxLoop,
        blockId: id,
        findBy: data.findBy,
        selector: data.selector,
      });

      const loopPayload = {
        maxLoop,
        index: 0,
        blockId: id,
        data: elements,
        id: data.loopId,
        type: 'elements',
      };

      if (data.loadMoreAction !== 'none') {
        loopPayload.loadMoreAction = {
          maxLoop,
          loopAttrId: loopId,
          loopId: data.loopId,
          findBy: data.findBy,
          type: data.loadMoreAction,
          selector: data.selector.trim(),
          actionElMaxWaitTime: data.actionElMaxWaitTime,
          actionElSelector: data.actionElSelector.trim(),
          actionPageMaxWaitTime: data.actionPageMaxWaitTime,
        };
      }

      this.loopList[data.loopId] = loopPayload;
      /* eslint-disable-next-line */
      refData.loopData[data.loopId] = {
        $index: 0,
        data: elements[0],
      };
    }

    return {
      data: refData.loopData[data.loopId],
      nextBlockId: this.getBlockConnections(id),
    };
  } catch (error) {
    if (error?.message === 'element-not-found') {
      error.data = { selector: data.selector };
    }

    throw error;
  }
}

export default loopElements;

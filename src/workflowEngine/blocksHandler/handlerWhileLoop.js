import testConditions from '@/utils/testConditions';

async function whileLoop({ data, id }, { refData }) {
  const conditionPayload = {
    refData,
    isMV2: this.engine.isMV2,
    isPopup: this.engine.isPopup,
    activeTab: this.activeTab.id,
    sendMessage: (payload) =>
      this._sendMessageToTab({ ...payload.data, label: 'conditions', id }),
  };
  const result = await testConditions(data.conditions, conditionPayload);
  const nextBlockId = this.getBlockConnections(
    id,
    result.isMatch ? 1 : 'fallback'
  );

  return {
    data: '',
    nextBlockId,
    replacedValue: result?.replacedValue || {},
  };
}

export default whileLoop;

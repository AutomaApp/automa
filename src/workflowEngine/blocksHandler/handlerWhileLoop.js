import testConditions from '@/utils/testConditions';
import checkCodeCondition from '../utils/conditionCode';

async function whileLoop({ data, id }, { refData }) {
  const { debugMode } = this.engine.workflow?.settings || {};
  const conditionPayload = {
    refData,
    isMV2: this.engine.isMV2,
    isPopup: this.engine.isPopup,
    activeTab: this.activeTab.id,
    checkCodeCondition: (payload) => {
      payload.debugMode = debugMode;
      return checkCodeCondition(this.activeTab, payload);
    },
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

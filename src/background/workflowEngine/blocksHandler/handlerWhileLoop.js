import testConditions from '@/utils/testConditions';
import { getBlockConnection } from '../helper';

async function whileLoop({ data, outputs, id }, { refData }) {
  const conditionPayload = {
    refData,
    activeTab: this.activeTab.id,
    sendMessage: (payload) =>
      this._sendMessageToTab({ ...payload.data, name: 'conditions', id }),
  };
  const result = await testConditions(data.conditions, conditionPayload);
  const nextBlockId = getBlockConnection({ outputs }, result.isMatch ? 1 : 2);

  return {
    data: '',
    nextBlockId,
    replacedValue: result?.replacedValue || {},
  };
}

export default whileLoop;

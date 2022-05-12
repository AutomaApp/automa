import compareBlockValue from '@/utils/compareBlockValue';
import mustacheReplacer from '@/utils/referenceData/mustacheReplacer';
import testConditions from '@/utils/testConditions';
import { getBlockConnection } from '../helper';

async function conditions({ data, outputs }, { prevBlockData, refData }) {
  if (data.conditions.length === 0) {
    throw new Error('conditions-empty');
  }

  let resultData = '';
  let isConditionMatch = false;
  let outputIndex = data.conditions.length + 1;

  const replacedValue = {};
  const condition = data.conditions[0];
  const prevData = Array.isArray(prevBlockData)
    ? prevBlockData[0]
    : prevBlockData;

  if (condition && condition.conditions) {
    const conditionPayload = {
      refData,
      activeTab: this.activeTab.id,
      sendMessage: (payload) =>
        this._sendMessageToTab({ ...payload, isBlock: false }),
    };

    for (let index = 0; index < data.conditions.length; index += 1) {
      const result = await testConditions(
        data.conditions[index].conditions,
        conditionPayload
      );

      Object.assign(replacedValue, result?.replacedValue || {});

      if (result.isMatch) {
        isConditionMatch = true;
        outputIndex = index + 1;

        break;
      }
    }
  } else {
    data.conditions.forEach(({ type, value, compareValue }, index) => {
      if (isConditionMatch) return;

      const firstValue = mustacheReplacer(compareValue ?? prevData, refData);
      const secondValue = mustacheReplacer(value, refData);

      Object.assign(replacedValue, firstValue.list, secondValue.list);

      const isMatch = compareBlockValue(
        type,
        firstValue.value,
        secondValue.value
      );

      if (isMatch) {
        resultData = value;
        outputIndex = index + 1;
        isConditionMatch = true;
      }
    });
  }

  return {
    replacedValue,
    data: resultData,
    nextBlockId: getBlockConnection({ outputs }, outputIndex),
  };
}

export default conditions;

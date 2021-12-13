import { getBlockConnection } from '../helper';
import { replaceMustache } from '@/utils/helper';
import { replaceMustacheHandler } from '@/utils/reference-data';
import compareBlockValue from '@/utils/compare-block-value';

function conditions({ data, outputs }, { prevBlockData, refData }) {
  return new Promise((resolve, reject) => {
    if (data.conditions.length === 0) {
      reject(new Error('conditions-empty'));
      return;
    }

    let resultData = '';
    let isConditionMatch = false;
    let outputIndex = data.conditions.length + 1;
    const handleMustache = (match) => replaceMustacheHandler(match, refData);
    const prevData = Array.isArray(prevBlockData)
      ? prevBlockData[0]
      : prevBlockData;

    data.conditions.forEach(({ type, value, compareValue }, index) => {
      if (isConditionMatch) return;

      const firstValue = replaceMustache(
        compareValue ?? prevData,
        handleMustache
      );
      const secondValue = replaceMustache(value, handleMustache);

      const isMatch = compareBlockValue(type, firstValue, secondValue);

      if (isMatch) {
        resultData = value;
        outputIndex = index + 1;
        isConditionMatch = true;
      }
    });

    resolve({
      data: resultData,
      nextBlockId: getBlockConnection({ outputs }, outputIndex),
    });
  });
}

export default conditions;

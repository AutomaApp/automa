import { getBlockConnection } from '../helper';
import compareBlockValue from '@/utils/compare-block-value';
import mustacheReplacer from '@/utils/reference-data/mustache-replacer';

function conditions(block, { prevBlockData, refData }) {
  const data = block.data;
  const outputs = block.outputs
  return new Promise((resolve, reject) => {
    if (data.conditions.length === 0) {
      reject(new Error('conditions-empty'));
      return;
    }

    let resultData = '';
    let isConditionMatch = false;
    let outputIndex = data.conditions.length + 1;
    const prevData = Array.isArray(prevBlockData)
      ? prevBlockData[0]
      : prevBlockData;

    data.conditions.forEach(({ type, value, compareValue }, index) => {
      if (isConditionMatch) return;

      const firstValue = mustacheReplacer({
        str: compareValue ?? prevData,
        data: refData,
        block
      });
      const secondValue = mustacheReplacer({
        str: value,
        data: refData,
        block
      });

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

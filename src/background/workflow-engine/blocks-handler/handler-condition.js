import { getBlockConnection } from '../helper';
import compareBlockValue from '@/utils/compare-block-value';

function conditions({ data, outputs }, prevBlockData) {
  return new Promise((resolve, reject) => {
    if (data.conditions.length === 0) {
      reject(new Error('Conditions is empty'));
      return;
    }

    let outputIndex = data.conditions.length + 1;
    let resultData = '';
    const prevData = Array.isArray(prevBlockData)
      ? prevBlockData[0]
      : prevBlockData;

    data.conditions.forEach(({ type, value }, index) => {
      const result = compareBlockValue(type, prevData, value);

      if (result) {
        resultData = value;
        outputIndex = index + 1;
      }
    });

    resolve({
      data: resultData,
      nextBlockId: getBlockConnection({ outputs }, outputIndex),
    });
  });
}

export default conditions;

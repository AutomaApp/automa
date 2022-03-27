/* eslint-disable no-restricted-syntax */
import mustacheReplacer from './reference-data/mustache-replacer';
import { conditionBuilder } from './shared';

const comparisons = {
  eq: (a, b) => a === b,
  nq: (a, b) => a !== b,
  gt: (a, b) => a > b,
  gte: (a, b) => a >= b,
  lt: (a, b) => a < b,
  lte: (a, b) => a <= b,
  cnt: (a, b) => a?.includes(b) ?? false,
  itr: (a) => Boolean(a),
  ifl: (a) => !a,
};

export default async function (conditionsArr, workflowData) {
  const result = {
    isMatch: false,
    replacedValue: {},
  };

  async function getConditionItemValue({ type, data }) {
    const copyData = JSON.parse(JSON.stringify(data));

    Object.keys(data).forEach((key) => {
      const { value, list } = mustacheReplacer(
        copyData[key],
        workflowData.refData
      );

      copyData[key] = value;
      Object.assign(result.replacedValue, list);
    });

    if (type === 'value') return copyData.value;

    if (type.startsWith('element')) {
      const conditionValue = await workflowData.sendMessage({
        type: 'condition-builder',
        data: {
          type,
          data: copyData,
        },
      });

      return conditionValue;
    }

    return '';
  }
  async function checkConditions(items) {
    let conditionResult = true;
    const condition = {
      value: '',
      operator: '',
    };

    for (const { category, data, type } of items) {
      if (!conditionResult) return conditionResult;

      if (category === 'compare') {
        const isNeedValue = conditionBuilder.compareTypes.find(
          ({ id }) => id === type
        ).needValue;

        if (!isNeedValue) {
          conditionResult = comparisons[type](condition.value);

          return conditionResult;
        }

        condition.operator = type;
      } else if (category === 'value') {
        const conditionValue = await getConditionItemValue({ data, type });
        const isCompareable = conditionBuilder.valueTypes.find(
          ({ id }) => id === type
        ).compareable;

        if (!isCompareable) {
          conditionResult = conditionValue;
        } else if (condition.operator) {
          conditionResult = comparisons[condition.operator](
            condition.value,
            conditionValue
          );

          condition.operator = '';
        }

        condition.value = conditionValue;
      }
    }

    return conditionResult;
  }

  for (const { conditions } of conditionsArr) {
    if (result.isMatch) return result;

    let isAllMatch = false;

    for (const { items } of conditions) {
      isAllMatch = await checkConditions(items, workflowData);

      if (!isAllMatch) break;
    }

    result.isMatch = isAllMatch;
  }

  return result;
}

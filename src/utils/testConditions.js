import cloneDeep from 'lodash.clonedeep';
import mustacheReplacer from './referenceData/mustacheReplacer';
import { conditionBuilder } from './shared';

const isBoolStr = (str) => {
  if (str === 'true') return true;
  if (str === 'false') return false;

  return str;
};
const isNumStr = (str) => (Number.isNaN(+str) ? str : +str);
const comparisons = {
  eq: (a, b) => a === b,
  eqi: (a, b) => a?.toLocaleLowerCase() === b?.toLocaleLowerCase(),
  nq: (a, b) => a !== b,
  gt: (a, b) => isNumStr(a) > isNumStr(b),
  gte: (a, b) => isNumStr(a) >= isNumStr(b),
  lt: (a, b) => isNumStr(a) < isNumStr(b),
  lte: (a, b) => isNumStr(a) <= isNumStr(b),
  cnt: (a, b) => a?.includes(b) ?? false,
  cni: (a, b) =>
    a?.toLocaleLowerCase().includes(b?.toLocaleLowerCase()) ?? false,
  nct: (a, b) => !comparisons.cnt(a, b),
  nci: (a, b) => !comparisons.cni(a, b),
  stw: (a, b) => a?.startsWith(b) ?? false,
  enw: (a, b) => a?.endsWith(b) ?? false,
  rgx: (a, b) => {
    const match = b.match(/^\/(.*?)\/([gimy]*)$/);
    const regex = match ? new RegExp(match[1], match[2]) : new RegExp(b);

    return regex.test(a);
  },
  itr: (a) => Boolean(isBoolStr(a)),
  ifl: (a) => !isBoolStr(a),
};

export default async function (conditionsArr, workflowData) {
  const result = {
    isMatch: false,
    replacedValue: {},
  };

  async function getConditionItemValue({ type, data }) {
    const copyData = cloneDeep(data);

    Object.keys(data).forEach((key) => {
      const { value, list } = mustacheReplacer(
        copyData[key],
        workflowData.refData
      );

      copyData[key] = value ?? '';
      Object.assign(result.replacedValue, list);
    });

    if (type === 'value') return copyData.value;

    if (type.startsWith('element') || type.startsWith('code')) {
      const conditionValue = await workflowData.sendMessage({
        type: 'condition-builder',
        data: {
          type,
          data: copyData,
          refData: workflowData.refData,
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
        const { needValue } = conditionBuilder.compareTypes.find(
          ({ id }) => id === type
        );

        if (!needValue) {
          conditionResult = comparisons[type](condition.value);

          return conditionResult;
        }

        condition.operator = type;
      } else if (category === 'value') {
        const conditionValue = await getConditionItemValue({ data, type });
        const { compareable } = conditionBuilder.valueTypes.find(
          ({ id }) => id === type
        );

        if (!compareable) {
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

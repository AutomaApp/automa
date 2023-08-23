import cloneDeep from 'lodash.clonedeep';
import objectPath from 'object-path';
import { parseJSON } from '@/utils/helper';
import { conditionBuilder } from '@/utils/shared';
import renderString from '../templating/renderString';

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

const convertDataType = {
  string: (val) => `${val}`,
  number: (val) => +val,
  json: (val) => parseJSON(val, null),
  boolean: (val) => Boolean(isBoolStr(val)),
};

export default async function (conditionsArr, workflowData) {
  const result = {
    isMatch: false,
    replacedValue: {},
  };

  async function getConditionItemValue({ type, data }) {
    if (type.startsWith('data')) {
      let dataPath = data.dataPath.trim().replace('@', '.');
      const isInsideBrackets =
        dataPath.startsWith('{{') && dataPath.endsWith('}}');

      if (isInsideBrackets) {
        dataPath = dataPath.slice(2, -2).trim();
      }

      return objectPath.has(workflowData.refData, dataPath);
    }

    const copyData = cloneDeep(data);

    for (const key of Object.keys(data)) {
      const { value, list } = await renderString(
        copyData[key],
        workflowData.refData,
        workflowData.isPopup
      );

      copyData[key] = value ?? '';
      Object.assign(result.replacedValue, list);
    }

    if (type === 'value') {
      const regex = /^(json|string|number|boolean)::/;
      if (regex.test(copyData.value)) {
        const [dataType, value] = copyData.value.split(/::(.*)/s);
        return convertDataType[dataType](value);
      }

      return copyData.value;
    }

    if (type.startsWith('code')) {
      let conditionValue;

      const newRefData = {};
      Object.keys(workflowData.refData).forEach((keyword) => {
        if (!copyData.code.includes(keyword)) return;

        newRefData[keyword] = workflowData.refData[keyword];
      });

      if (workflowData.isMV2 && data.context !== 'background') {
        conditionValue = await workflowData.sendMessage({
          type: 'condition-builder',
          data: {
            type,
            data: copyData,
            refData: newRefData,
          },
        });
      } else {
        conditionValue = await workflowData.checkCodeCondition({
          data: copyData,
          refData: newRefData,
          isPopup: workflowData.isPopup,
        });
      }

      return conditionValue;
    }

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

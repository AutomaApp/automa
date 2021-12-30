import { set as setObjectPath } from 'object-path-immutable';
import dayjs from 'dayjs';
import { objectHasKey } from '@/utils/helper';
import mustacheReplacer from './mustache-replacer';

export const funcs = {
  date: (...params) => {
    let date = new Date();
    let dateFormat = 'DD-MM-YYYY';

    const getDateFormat = (value) =>
      value ? value?.replace(/['"]/g, '') : dateFormat;

    if (params.length === 1) {
      dateFormat = getDateFormat(params[0][0]);
    } else if (params.length >= 2) {
      date = new Date(params[0]);
      dateFormat = getDateFormat(params[1][0]);
    }

    /* eslint-disable-next-line */
    const isValidDate = date instanceof Date && !isNaN(date);
    const result = dayjs(isValidDate ? date : Date.now()).format(dateFormat);

    return result;
  },
};

export default function ({ block, data }) {
  const replaceKeys = [
    'url',
    'name',
    'body',
    'value',
    'fileName',
    'selector',
    'prefixText',
    'globalData',
    'suffixText',
    'extraRowValue',
  ];
  let replacedBlock = { ...block };
  const refData = Object.assign(data, { funcs });

  replaceKeys.forEach((blockDataKey) => {
    if (!objectHasKey(block.data, blockDataKey)) return;

    const newDataValue = mustacheReplacer(
      replacedBlock.data[blockDataKey],
      refData
    );

    replacedBlock = setObjectPath(
      replacedBlock,
      `data.${blockDataKey}`,
      newDataValue
    );
  });

  return replacedBlock;
}

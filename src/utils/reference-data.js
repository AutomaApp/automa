import { get, set } from 'object-path-immutable';
import { isObject, objectHasKey, replaceMustache } from '@/utils/helper';

const objectPath = { get, set };
const refKeys = [
  { name: 'dataColumn', key: 'dataColumns' },
  { name: 'dataColumns', key: 'dataColumns' },
];

export function parseKey(key) {
  /* eslint-disable-next-line */
  let [dataKey, path] = key.split('@');

  dataKey =
    (refKeys.find((item) => item.name === dataKey) || {}).key || dataKey;

  if (dataKey !== 'dataColumns') return { dataKey, path: path || '' };

  const pathArr = path?.split('.') ?? [];
  let dataPath = path;

  if (pathArr.length === 1) {
    dataPath = `0.${pathArr[0]}`;
  } else if (typeof +pathArr[0] !== 'number' || Number.isNaN(+pathArr[0])) {
    dataPath = `0.${pathArr.join('.')}`;
  }

  if (dataPath.endsWith('.')) dataPath = dataPath.slice(0, -1);

  return { dataKey: 'data', path: dataPath };
}
export function replaceMustacheHandler(match, data) {
  const key = match.slice(2, -2).replace(/\s/g, '');

  if (!key) return '';

  const { dataKey, path } = parseKey(key);
  const result = objectPath.get(data[dataKey], path) ?? match;

  return isObject(result) ? JSON.stringify(result) : result;
}

export default function (block, data) {
  const replaceKeys = [
    'url',
    'name',
    'body',
    'value',
    'fileName',
    'selector',
    'prefixText',
    'suffixText',
  ];
  let replacedBlock = block;

  replaceKeys.forEach((blockDataKey) => {
    if (!objectHasKey(block.data, blockDataKey)) return;

    const newDataValue = replaceMustache(
      replacedBlock.data[blockDataKey],
      (match) => replaceMustacheHandler(match, data)
    );

    replacedBlock = objectPath.set(
      replacedBlock,
      `data.${blockDataKey}`,
      newDataValue
    );
  });

  return replacedBlock;
}

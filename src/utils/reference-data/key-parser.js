import { objectHasKey } from '../helper';

const refKeys = {
  dataColumn: 'dataColumns',
  dataColumns: 'dataColumns',
};

export default function (key) {
  /* eslint-disable-next-line */
  let [dataKey, path] = key.split('@');

  dataKey = objectHasKey(refKeys, dataKey) ? refKeys[dataKey] : dataKey;

  if (dataKey !== 'dataColumns') {
    if (dataKey === 'loopData' && !path.endsWith('.$index')) {
      const pathArr = path.split('.');
      pathArr.splice(1, 0, 'data');

      path = pathArr.join('.');
    }

    return { dataKey, path: path || '' };
  }

  const pathArr = path?.split('.') ?? [];
  let dataPath = path;

  if (pathArr.length === 1) {
    dataPath = `0.${pathArr[0]}`;
  } else if (typeof +pathArr[0] !== 'number' || Number.isNaN(+pathArr[0])) {
    dataPath = `0.${pathArr.join('.')}`;
  }

  if (dataPath.endsWith('.')) dataPath = dataPath.slice(0, -1);

  return { dataKey: 'dataColumns', path: dataPath };
}

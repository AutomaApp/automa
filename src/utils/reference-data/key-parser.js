const refKeys = {
  table: 'table',
  dataColumn: 'table',
  dataColumns: 'table',
};

export default function (key) {
  let [dataKey, path] = key.split(/@(.+)/);

  dataKey = refKeys[dataKey] ?? dataKey;

  if (!path) return { dataKey, path: '' };

  if (dataKey !== 'table') {
    if (dataKey === 'loopData' && !path.endsWith('.$index')) {
      const pathArr = path.split('.');
      pathArr.splice(1, 0, 'data');

      path = pathArr.join('.');
    }

    return { dataKey, path };
  }

  const pathArr = path.split('.');

  if (pathArr.length === 1) {
    path = `0.${pathArr[0]}`;
  } else if (typeof +pathArr[0] !== 'number' || Number.isNaN(+pathArr[0])) {
    path = `0.${pathArr.join('.')}`;
  }

  if (path.endsWith('.')) path = path.slice(0, -1);

  return { dataKey: 'table', path };
}

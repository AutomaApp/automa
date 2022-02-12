import objectPath from 'object-path';

const refKeys = {
  table: 'table',
  dataColumn: 'table',
  dataColumns: 'table',
};

export function extractStrFunction(str) {
  const extractedStr = /^\$\s*(\w+)\s*\((.*)\)/.exec(str.trim());

  if (!extractedStr) return null;

  const { 1: name, 2: funcParams } = extractedStr;
  const params = funcParams
    .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map((param) => param?.trim().replace(/^['"]|['"]$/g, '') || '');

  return {
    name,
    params,
  };
}

export function keyParser(key, data) {
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

  const [firstPath, restPath] = path.split(/\.(.+)/);

  if (firstPath === '$last') {
    const lastIndex = data.table.length - 1;

    path = `${lastIndex}.${restPath || ''}`;
  } else if (!restPath) {
    path = `0.${firstPath}`;
  } else if (typeof +firstPath !== 'number' || Number.isNaN(+firstPath)) {
    path = `0.${firstPath}.${restPath}`;
  }

  path = path.replace(/\.$/, '');

  return { dataKey: 'table', path };
}

function replacer(str, { regex, tagLen, modifyPath, data }) {
  return str.replace(regex, (match) => {
    let key = match.slice(tagLen, -tagLen).trim();

    if (!key) return '';
    if (modifyPath && typeof modifyPath === 'function') {
      key = modifyPath(key);
    }

    let result = '';
    const funcRef = extractStrFunction(key);

    if (funcRef && data.funcs[funcRef.name]) {
      result = data.funcs[funcRef.name]?.apply(
        { refData: data },
        funcRef.params
      );
    } else {
      const { dataKey, path } = keyParser(key, data);

      result = objectPath.get(data[dataKey], path) ?? match;
    }

    return typeof result === 'string' ? result : JSON.stringify(result);
  });
}

export default function (str, data) {
  if (!str || typeof str !== 'string') return '';

  const replacedStr = replacer(str, {
    data,
    tagLen: 2,
    regex: /\{\{(.*?)\}\}/g,
    modifyPath: (path) =>
      replacer(path, {
        data,
        tagLen: 1,
        regex: /\[(.*?)\]/g,
      }),
  });

  return replacedStr;
}

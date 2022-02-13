import objectPath from 'object-path';
import dayjs from '@/lib/dayjs';

const refKeys = {
  table: 'table',
  dataColumn: 'table',
  dataColumns: 'table',
};

/* eslint-disable prefer-destructuring */
export const functions = {
  date(...args) {
    let date = new Date();
    let dateFormat = 'DD-MM-YYYY';

    if (args.length === 1) {
      dateFormat = args[0];
    } else if (args.length >= 2) {
      date = new Date(args[0]);
      dateFormat = args[1];
    }

    /* eslint-disable-next-line */
    const isValidDate = date instanceof Date && !isNaN(date);
    const dayjsDate = dayjs(isValidDate ? date : Date.now());

    const result =
      dateFormat === 'relative'
        ? dayjsDate.fromNow()
        : dayjsDate.format(dateFormat);

    return result;
  },
  randint(min = 0, max = 100) {
    return Math.round(Math.random() * (+max - +min) + +min);
  },
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

    if (funcRef && data.functions[funcRef.name]) {
      result = data.functions[funcRef.name]?.apply(
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

export default function (str, refData) {
  if (!str || typeof str !== 'string') return '';

  const data = { ...refData, functions };
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

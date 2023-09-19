import objectPath from 'object-path';
import credentialUtil from '@/utils/credentialUtil';
import { parseJSON } from '@/utils/helper';
import templatingFunctions from './templatingFunctions';

const refKeys = {
  table: 'table',
  dataColumn: 'table',
  dataColumns: 'table',
};

export function extractStrFunction(str) {
  const extractedStr = /^\$\s*(\w+)\s*\((.*)\)/.exec(
    str.trim().replace(/\r?\n|\r/g, '')
  );

  if (!extractedStr) return null;
  const { 1: name, 2: funcParams } = extractedStr;
  const params = funcParams
    .split(/,(?=(?:[^'"\\"\\']*['"][^'"]*['"\\"\\'])*[^'"]*$)/)
    .map((param) => param.trim().replace(/^['"]|['"]$/g, '') || '');

  return {
    name,
    params,
  };
}

export function keyParser(key, data) {
  let [dataKey, path] = key.split(/[@.](.+)/);

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
  const replaceResult = {
    list: {},
    value: str,
  };

  replaceResult.value = str.replace(regex, (match) => {
    let key = match.slice(tagLen, -tagLen).trim();

    if (!key) return '';

    let result = '';
    let stringify = false;
    const isFunction = extractStrFunction(key);
    const funcRef = isFunction && data.functions[isFunction.name];

    if (modifyPath && !funcRef) {
      key = modifyPath(key);
    }

    if (funcRef) {
      const funcParams = isFunction.params.map((param) => {
        const { value, list } = replacer(param, {
          data,
          tagLen: 1,
          regex: /\[(.*?)\]/,
        });

        Object.assign(replaceResult.list, list);

        return parseJSON(value, value);
      });

      result = funcRef.apply({ refData: data }, funcParams);
    } else {
      /* eslint-disable-next-line */
      let { dataKey, path } = keyParser(key, data);
      if (dataKey.startsWith('!')) {
        stringify = true;
        dataKey = dataKey.slice(1);
      }

      result = objectPath.get(data[dataKey], path) ?? match;

      if (dataKey === 'secrets') {
        result =
          typeof result !== 'string' ? {} : credentialUtil.decrypt(result);
      }
    }

    const finalResult =
      typeof result === 'string' && !stringify
        ? result
        : JSON.stringify(result);

    replaceResult.list[match] = finalResult?.slice(0, 512) ?? finalResult;

    return finalResult;
  });

  return replaceResult;
}

export default function (str, refData) {
  if (!str || typeof str !== 'string') return '';

  const data = { ...refData, functions: templatingFunctions };
  const replacedList = {};

  const replacedStr = replacer(`${str}`, {
    data,
    tagLen: 2,
    regex: /\{\{(.*?)\}\}/g,
    modifyPath: (path) => {
      const { value, list } = replacer(path, {
        data,
        tagLen: 1,
        regex: /\[(.*?)\]/g,
      });
      Object.assign(replacedList, list);

      return value;
    },
  });

  Object.assign(replacedStr.list, replacedList);

  return replacedStr;
}

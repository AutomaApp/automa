import { get as getObjectPath } from 'object-path-immutable';
import { replaceMustache, isObject } from '../helper';
import keyParser from './key-parser';

export function extractStrFunction(str) {
  const extractedStr = /^\$\s*(\w+)\s*\((.*)\)/.exec(str.trim());

  if (!extractedStr) return null;

  return {
    name: extractedStr[1],
    params: extractedStr[2].split(','),
  };
}

export default function (str, data) {
  const replacedStr = replaceMustache(str, (match) => {
    const key = match.slice(2, -2).replace(/\s/g, '');

    if (!key) return '';

    const funcRef = extractStrFunction(key);

    if (funcRef && data.funcs[funcRef.name]) {
      return data.funcs[funcRef.name]?.apply({ refData: data }, funcRef.params);
    }

    const { dataKey, path } = keyParser(key);
    const result = getObjectPath(data[dataKey], path) ?? match;

    return isObject(result) ? JSON.stringify(result) : result;
  });

  return replacedStr;
}

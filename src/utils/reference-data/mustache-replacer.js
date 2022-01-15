import { get as getObjectPath } from 'object-path-immutable';
import { replaceMustache } from '../helper';
import keyParser from './key-parser';

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

export default function ({ str, data, block }) {
  const replacedStr = replaceMustache(str, (match) => {
    const key = match.slice(2, -2).trim();

    if (!key) return '';

    let result = '';
    const funcRef = extractStrFunction(key);

    if (funcRef && data.funcs[funcRef.name]) {
      result = data.funcs[funcRef.name]?.apply(
        { refData: data },
        funcRef.params
      );
    } else {
      const { dataKey, path } = keyParser(key);
      result = getObjectPath(data[dataKey], path) ?? match;
    }
    if (block && block.name === 'webhook') {
      return JSON.stringify(result);
    }
    return typeof result === 'string' ? result : JSON.stringify(result);
  });

  return replacedStr;
}

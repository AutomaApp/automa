import { get as getObjectPath } from 'object-path-immutable';
import { replaceMustache } from '../helper';
import keyParser from './key-parser';

export function extractStrFunction(str) {
  const extractedStr = /^\$\s*(\w+)\s*\((.*)\)/.exec(str.trim());

  if (!extractedStr) return null;

  return {
    name: extractedStr[1],
    params: extractedStr[2].split(','),
  };
}

export default function ({ str, data, block }) {
  const replacedStr = replaceMustache(str, (match) => {
    const key = match.slice(2, -2).replace(/\s/g, '');

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

    if (block.name === 'webhook') {
      return JSON.stringify(result);
    }
    return typeof result === 'string' ? result : JSON.stringify(result);
  });

  return replacedStr;
}

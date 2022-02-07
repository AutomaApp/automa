import objectPath from 'object-path';
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

export default function (str, data) {
  if (!str || typeof str !== 'string') return '';

  const replacedStr = str.replace(/\{\{(.*?)\}\}/g, (match) => {
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
      result = objectPath.get(data[dataKey], path) ?? match;
    }

    return typeof result === 'string' ? result : JSON.stringify(result);
  });

  return replacedStr;
}

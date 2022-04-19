import Papa from 'papaparse';
import { fileSaver } from './helper';

export const files = {
  'plain-text': {
    mime: 'text/plain',
    ext: '.txt',
  },
  json: {
    mime: 'application/json',
    ext: '.json',
  },
  csv: {
    mime: 'text/csv',
    ext: '.csv',
  },
};

export function generateJSON(keys, data) {
  if (Array.isArray(data)) return data;

  const result = [];

  keys.forEach((key) => {
    for (let index = 0; index < data[key].length; index += 1) {
      const currData = data[key][index];

      if (typeof result[index] === 'undefined') {
        result.push({ [key]: currData });
      } else {
        result[index][key] = currData;
      }
    }
  });

  return result;
}

export default function (
  data,
  { name, type, addBOMHeader, returnUrl },
  converted
) {
  let result = data;

  if (type === 'csv' || type === 'json') {
    const jsonData = converted ? data : generateJSON(Object.keys(data), data);

    result =
      type === 'csv'
        ? Papa.unparse(jsonData)
        : JSON.stringify(jsonData, null, 2);
  } else if (type === 'plain-text') {
    const extractObj = (obj) => {
      if (typeof obj !== 'object') return [obj];

      return Object.values(obj);
    };

    result = (
      Array.isArray(data)
        ? data.flatMap((item) => extractObj(item))
        : extractObj(data)
    ).join(' ');
  }

  const payload = [result];

  if (type === 'csv' && addBOMHeader) {
    payload.unshift(new Uint8Array([0xef, 0xbb, 0xbf]));
  }

  const { mime, ext } = files[type];
  const blobUrl = URL.createObjectURL(new Blob(payload, { type: mime }));

  if (!returnUrl) fileSaver(`${name || 'unnamed'}${ext}`, blobUrl);

  return blobUrl;
}

import Papa from 'papaparse';

const files = {
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

export default function (data, { name, type }, converted) {
  let result = data;

  if (type === 'csv' || type === 'json') {
    const jsonData = converted ? data : generateJSON(Object.keys(data), data);

    result =
      type === 'csv'
        ? `data:text/csv;charset=utf-8,${Papa.unparse(jsonData)}`
        : JSON.stringify(jsonData, null, 2);
  } else if (type === 'plain-text') {
    result = Object.values(data).join(' ');
  }

  const { mime, ext } = files[type];
  const blob = new Blob([result], {
    type: mime,
  });

  const anchor = document.createElement('a');
  anchor.download = `${name || 'unnamed'}${ext}`;
  anchor.href = URL.createObjectURL(blob);

  anchor.dispatchEvent(new MouseEvent('click'));
}

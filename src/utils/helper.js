export function findTriggerBlock(drawflow = {}) {
  if (!drawflow) return null;

  const blocks = Object.values(drawflow.drawflow?.Home?.data);

  if (!blocks) return null;

  return blocks.find(({ name }) => name === 'trigger');
}

export function throttle(callback, limit) {
  let waiting = false;

  return (...args) => {
    if (!waiting) {
      callback.apply(this, args);
      waiting = true;
      setTimeout(() => {
        waiting = false;
      }, limit);
    }
  };
}

export function convertArrObjTo2DArr(arr) {
  const keyIndex = new Map();
  const values = [[]];

  arr.forEach((obj) => {
    const keys = Object.keys(obj);
    const row = [];

    keys.forEach((key) => {
      if (!keyIndex.has(key)) {
        keyIndex.set(key, keyIndex.size);
        values[0].push(key);
      }

      const rowIndex = keyIndex.get(key);
      row[rowIndex] = obj[key];
    });

    values.push([...row]);
  });

  return values;
}

export function convert2DArrayToArrayObj(values) {
  let keyIndex = 0;
  const keys = values.shift();
  const result = [];

  for (let columnIndex = 0; columnIndex < values.length; columnIndex += 1) {
    const currentColumn = {};

    for (
      let rowIndex = 0;
      rowIndex < values[columnIndex].length;
      rowIndex += 1
    ) {
      let key = keys[rowIndex];

      if (!key) {
        keyIndex += 1;
        key = `_row${keyIndex}`;
        keys.push(key);
      }

      currentColumn[key] = values[columnIndex][rowIndex];
    }

    result.push(currentColumn);
  }

  return result;
}

export function parseJSON(data, def) {
  try {
    const result = JSON.parse(data);

    return result;
  } catch (error) {
    return def;
  }
}

export function parseFlow(flow) {
  const obj = typeof flow === 'string' ? parseJSON(flow, {}) : flow;

  return obj?.drawflow?.Home.data;
}

export function replaceMustache(str, replacer) {
  /* eslint-disable-next-line */
  return str.replace(/\{\{(.*?)\}\}/g, replacer);
}

export function openFilePicker(acceptedFileTypes = [], attrs = {}) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = Array.isArray(acceptedFileTypes)
      ? acceptedFileTypes.join(',')
      : acceptedFileTypes;

    Object.entries(attrs).forEach(([key, value]) => {
      input[key] = value;
    });

    input.onchange = (event) => {
      const { files } = event.target;
      const validFiles = [];

      files.forEach((file) => {
        if (!acceptedFileTypes.includes(file.type)) return;

        validFiles.push(file);
      });

      resolve(validFiles);
    };

    input.click();
  });
}

export function fileSaver(fileName, data) {
  const anchor = document.createElement('a');
  anchor.download = fileName;
  anchor.href = data;

  anchor.dispatchEvent(new MouseEvent('click'));
  anchor.remove();
}

export function countDuration(started, ended) {
  const duration = Math.round((ended - started) / 1000);
  const minutes = parseInt((duration / 60) % 60, 10);
  const seconds = parseInt(duration % 60, 10);

  const getText = (num, suffix) => (num > 0 ? `${num}${suffix}` : '');

  return `${getText(minutes, 'm')} ${seconds}s`;
}

export function toCamelCase(str) {
  const result = str.replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => {
    return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
  });

  return result.replace(/\s+|[-]/g, '');
}

export function isObject(obj) {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

export function objectHasKey(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function isWhitespace(str) {
  return !/\S/.test(str);
}

export function debounce(callback, time = 200) {
  let interval;

  return (...args) => {
    clearTimeout(interval);

    return new Promise((resolve) => {
      interval = setTimeout(() => {
        interval = null;

        callback(...args);
        resolve();
      }, time);
    });
  };
}

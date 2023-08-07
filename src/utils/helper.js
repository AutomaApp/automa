import browser from 'webextension-polyfill';

export async function getActiveTab() {
  try {
    let windowId = null;
    const tabsQuery = {
      active: true,
      url: '*://*/*',
    };
    const extURL = browser.runtime.getURL('');
    const windows = await browser.windows.getAll({ populate: true });
    for (const browserWindow of windows) {
      const [tab] = browserWindow.tabs;
      const isDashboard =
        browserWindow.tabs.length === 1 && tab.url?.includes(extURL);

      if (isDashboard) {
        await browser.windows.update(browserWindow.id, {
          focused: false,
          state: 'minimized',
        });
      } else if (browserWindow.focused) {
        windowId = browserWindow.id;
      }
    }

    if (windowId) tabsQuery.windowId = windowId;
    else if (windows.length > 2) tabsQuery.lastFocusedWindow = true;

    const [tab] = await browser.tabs.query(tabsQuery);

    return tab;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export function isXPath(str) {
  const regex = /^([(/@]|id\()/;

  return regex.test(str);
}

export function visibleInViewport(element) {
  const { top, left, bottom, right, height, width } =
    element.getBoundingClientRect();

  if (height === 0 || width === 0) return false;

  return (
    top >= 0 &&
    left >= 0 &&
    bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

export function sleep(timeout = 500) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
}

export function findTriggerBlock(drawflow = {}) {
  if (!drawflow) return null;

  if (drawflow.drawflow) {
    const blocks = Object.values(drawflow.drawflow?.Home?.data);
    if (!blocks) return null;

    return blocks.find(({ name }) => name === 'trigger');
  }
  if (drawflow.nodes) {
    return drawflow.nodes.find((node) => node.label === 'trigger');
  }

  return null;
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

      const value = obj[key];

      const rowIndex = keyIndex.get(key);
      row[rowIndex] = typeof value === 'object' ? JSON.stringify(value) : value;
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

  return obj;
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

      Array.from(files).forEach((file) => {
        if (!acceptedFileTypes.includes(file.type)) return;

        validFiles.push(file);
      });

      resolve(validFiles);
    };

    input.click();
  });
}

export function fileSaver(filename, data) {
  const anchor = document.createElement('a');
  anchor.download = filename;
  anchor.href = data;

  anchor.dispatchEvent(new MouseEvent('click'));
  anchor.remove();
}

export function countDuration(started, ended) {
  const duration = Math.round((ended - started) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);

  const getText = (num, suffix) => (num > 0 ? `${num}${suffix}` : '');

  return `${getText(minutes, 'm')} ${seconds}s`;
}

export function toCamelCase(str, capitalize = false) {
  const result = str.replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => {
    return index === 0 && !capitalize
      ? letter.toLowerCase()
      : letter.toUpperCase();
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

export async function clearCache(workflow) {
  try {
    await browser.storage.local.remove(`state:${workflow.id}`);

    const flows = parseJSON(workflow.drawflow, null);
    const blocks = flows && flows.drawflow.Home.data;

    if (blocks) {
      Object.values(blocks).forEach(({ name, id }) => {
        if (name !== 'loop-data') return;

        localStorage.removeItem(`index:${id}`);
      });
    }

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export function arraySorter({ data, key, order = 'asc' }) {
  let runCounts = {};
  const copyData = data.slice();

  if (key === 'mostUsed') {
    runCounts = parseJSON(localStorage.getItem('runCounts'), {}) || {};
  }

  return copyData.sort((a, b) => {
    let comparison = 0;
    let itemA = a[key] || a;
    let itemB = b[key] || b;

    if (key === 'mostUsed') {
      itemA = runCounts[a.id] || 0;
      itemB = runCounts[b.id] || 0;
    }

    if (itemA > itemB) {
      comparison = 1;
    } else if (itemA < itemB) {
      comparison = -1;
    }

    return order === 'desc' ? comparison * -1 : comparison;
  });
}

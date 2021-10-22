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
  return typeof obj === 'object' && object !== null;
}

export function objectHasKey(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
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

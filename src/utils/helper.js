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

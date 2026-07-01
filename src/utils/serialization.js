export function serializeFunctions(obj) {
  if (typeof obj === 'function') {
    return {
      __type: 'function',
      __value: obj.toString(),
    };
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => serializeFunctions(item));
  }

  if (obj && typeof obj === 'object') {
    const result = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = serializeFunctions(obj[key]);
      }
    }
    return result;
  }

  return obj;
}

export function deserializeFunctions(obj) {
  if (obj && typeof obj === 'object') {
    if (obj.__type === 'function') {
      // eslint-disable-next-line no-new-func, prefer-template
      return new Function('return ' + obj.__value)();
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => deserializeFunctions(item));
    }

    const result = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = deserializeFunctions(obj[key]);
      }
    }
    return result;
  }

  return obj;
}

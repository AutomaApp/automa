import objectPath from 'object-path';
import dayjs from '@/lib/dayjs';
import { parseJSON } from '@/utils/helper';
import credentialUtil from '@/utils/credentialUtil';

const refKeys = {
  table: 'table',
  dataColumn: 'table',
  dataColumns: 'table',
};
const isAllNums = (...args) => args.every((arg) => !Number.isNaN(+arg));

/* eslint-disable prefer-destructuring, no-useless-escape */
export const functions = {
  date(...args) {
    let date = new Date();
    let dateFormat = 'DD-MM-YYYY';

    if (args.length === 1) {
      dateFormat = args[0];
    } else if (args.length >= 2) {
      date = new Date(args[0]);
      dateFormat = args[1];
    }

    /* eslint-disable-next-line */
    const isValidDate = date instanceof Date && !isNaN(date);
    const dayjsDate = dayjs(isValidDate ? date : Date.now());

    let result = dayjsDate.format(dateFormat);

    if (dateFormat === 'relative') result = dayjsDate.fromNow();
    else if (dateFormat === 'timestamp') result = dayjsDate.valueOf();

    return result;
  },
  randint(min = 0, max = 100) {
    return Math.round(Math.random() * (+max - +min) + +min);
  },
  getLength(str) {
    const value = parseJSON(str, str);

    return value.length ?? value;
  },
  slice(value, start, end) {
    if (!value || !value.slice) return value;

    const startIndex = Number.isNaN(+start) ? 0 : +start;
    const endIndex = Number.isNaN(+end) ? value.length : +end;

    return value.slice(startIndex, endIndex);
  },
  multiply(value, multiplyBy) {
    if (!isAllNums(value, multiplyBy)) return value;

    return +value * +multiplyBy;
  },
  increment(value, incrementBy) {
    if (!isAllNums(value, incrementBy)) return value;

    return +value + +incrementBy;
  },
  divide(value, divideBy) {
    if (!isAllNums(value, divideBy)) return value;

    return +value / +divideBy;
  },
  subtract(value, subtractBy) {
    if (!isAllNums(value, subtractBy)) return value;

    return +value - +subtractBy;
  },
  randData(str) {
    const getRand = (data) => data[Math.floor(Math.random() * data.length)];
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const symbols = `!@#$%^&*()-_+={}[]|\;:'"<>,./?"`;
    const mapSamples = {
      l: () => getRand(lowercase),
      u: () => getRand(uppercase),
      d: () => getRand(digits),
      s: () => getRand(symbols),
      f() {
        return this.l() + this.u();
      },
      n() {
        return this.l() + this.d();
      },
      m() {
        return this.u() + this.d();
      },
      i() {
        return this.l() + this.u() + this.d();
      },
      a() {
        return getRand(lowercase + uppercase + digits.join('') + symbols);
      },
    };

    return `${str}`.replace(
      /\?[a-zA-Z]/g,
      (char) => mapSamples[char.at(-1)]?.() ?? char
    );
  },
};

export function extractStrFunction(str) {
  const extractedStr = /^\$\s*(\w+)\s*\((.*)\)/.exec(
    str.trim().replace(/\r?\n|\r/g, '')
  );

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

export function keyParser(key, data) {
  let [dataKey, path] = key.split(/@(.+)/);

  dataKey = refKeys[dataKey] ?? dataKey;

  if (!path) return { dataKey, path: '' };

  if (dataKey !== 'table') {
    if (dataKey === 'loopData' && !path.endsWith('.$index')) {
      const pathArr = path.split('.');
      pathArr.splice(1, 0, 'data');

      path = pathArr.join('.');
    }

    return { dataKey, path };
  }

  const [firstPath, restPath] = path.split(/\.(.+)/);

  if (firstPath === '$last') {
    const lastIndex = data.table.length - 1;

    path = `${lastIndex}.${restPath || ''}`;
  } else if (!restPath) {
    path = `0.${firstPath}`;
  } else if (typeof +firstPath !== 'number' || Number.isNaN(+firstPath)) {
    path = `0.${firstPath}.${restPath}`;
  }

  path = path.replace(/\.$/, '');

  return { dataKey: 'table', path };
}

function replacer(str, { regex, tagLen, modifyPath, data, stringify }) {
  const replaceResult = {
    list: {},
    value: str,
  };

  replaceResult.value = str.replace(regex, (match, p1, offset) => {
    let key = match.slice(tagLen, -tagLen).trim();

    if (!key) return '';

    let result = '';
    const isFunction = extractStrFunction(key);
    const funcRef = isFunction && data.functions[isFunction.name];

    if (modifyPath && !funcRef) {
      key = modifyPath(key);
    }

    if (funcRef) {
      const funcParams = isFunction.params.map((param) => {
        const { value, list } = replacer(param, {
          data,
          tagLen: 1,
          regex: /\[(.*?)\]/,
        });

        Object.assign(replaceResult.list, list);

        return parseJSON(value, value);
      });

      result = funcRef.apply({ refData: data }, funcParams);
    } else {
      const { dataKey, path } = keyParser(key, data);
      result = objectPath.get(data[dataKey], path) ?? match;

      if (dataKey === 'secrets') {
        result =
          typeof result !== 'string' ? {} : credentialUtil.decrypt(result);
      }
    }

    result =
      typeof result === 'string' && !stringify
        ? result
        : JSON.stringify(result);

    if (stringify) {
      const isQuote = (char) => char === '"';
      const isInsideQuote =
        isQuote(str[offset - 1]) && isQuote(str[match.length + offset]);

      if (isInsideQuote) result = result.slice(1, -1);
    }

    replaceResult.list[match] = result?.slice(0, 512) ?? result;

    return result;
  });

  return replaceResult;
}

export default function (str, refData, { stringify = false } = {}) {
  if (!str || typeof str !== 'string') return '';

  const data = { ...refData, functions };
  const replacedList = {};

  const replacedStr = replacer(`${str}`, {
    data,
    tagLen: 2,
    stringify,
    regex: /\{\{(.*?)\}\}/g,
    modifyPath: (path) => {
      const { value, list } = replacer(path, {
        data,
        tagLen: 1,
        regex: /\[(.*?)\]/g,
      });
      Object.assign(replacedList, list);

      return value;
    },
  });

  Object.assign(replacedStr.list, replacedList);

  return replacedStr;
}

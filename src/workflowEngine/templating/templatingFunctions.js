/* eslint-disable prefer-destructuring, no-useless-escape */
import jsonpath from 'jsonpath';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const isAllNums = (...args) => args.every((arg) => !Number.isNaN(+arg));
const isObject = (obj) =>
  typeof obj === 'object' && obj !== null && !Array.isArray(obj);

function parseJSON(data, def) {
  try {
    const result = JSON.parse(data);

    return result;
  } catch (error) {
    return def;
  }
}

export default {
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
    if (Array.isArray(str)) {
      const index = Math.floor(Math.random() * str.length);
      return str[index];
    }

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
  filter(data, exps) {
    if (!isObject(data) && !Array.isArray(data)) return data;

    return jsonpath.query(data, exps);
  },
  replace(value, search, replace) {
    if (!value) return value;

    return value.replace(search, replace);
  },
  replaceAll(value, search, replace) {
    if (!value) return value;

    return value.replaceAll(search, replace);
  },
  toLowerCase(value) {
    if (!value) return value;

    return value.toLowerCase();
  },
  toUpperCase(value) {
    if (!value) return value;

    return value.toUpperCase();
  },
  modulo(value, divisor) {
    return +value % +divisor;
  },
  stringify(value) {
    return JSON.stringify(value);
  },
};

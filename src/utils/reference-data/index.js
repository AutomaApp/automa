import dayjs from '@/lib/dayjs';
import { objectHasKey } from '@/utils/helper';
import mustacheReplacer from './mustache-replacer';

/* eslint-disable prefer-destructuring */
export const funcs = {
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

    const result =
      dateFormat === 'relative'
        ? dayjsDate.fromNow()
        : dayjsDate.format(dateFormat);

    return result;
  },
  randint(min = 0, max = 100) {
    return Math.round(Math.random() * (+max - +min) + +min);
  },
};

export default function ({ block, refKeys, data: refData }) {
  if (!refKeys || refKeys.length === 0) return block;

  const data = { ...refData, funcs };
  const copyBlock = JSON.parse(JSON.stringify(block));

  refKeys.forEach((blockDataKey) => {
    if (!objectHasKey(block.data, blockDataKey)) return;

    const currentData = copyBlock.data[blockDataKey];

    if (Array.isArray(currentData)) {
      currentData.forEach((str, index) => {
        currentData[index] = mustacheReplacer(str, data);
      });
    } else {
      copyBlock.data[blockDataKey] = mustacheReplacer(currentData, data);
    }
  });

  return copyBlock;
}

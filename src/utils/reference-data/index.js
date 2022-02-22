import { objectHasKey } from '@/utils/helper';
import mustacheReplacer from './mustache-replacer';

export default function ({ block, refKeys, data }) {
  if (!refKeys || refKeys.length === 0) return block;

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

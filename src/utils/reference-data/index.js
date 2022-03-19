import objectPath from 'object-path';
import mustacheReplacer from './mustache-replacer';

export default function ({ block, refKeys, data }) {
  if (!refKeys || refKeys.length === 0) return block;

  const copyBlock = JSON.parse(JSON.stringify(block));

  refKeys.forEach((blockDataKey) => {
    const currentData = objectPath.get(copyBlock.data, blockDataKey);

    if (!currentData) return;

    if (Array.isArray(currentData)) {
      currentData.forEach((str, index) => {
        objectPath.set(
          copyBlock.data,
          `${blockDataKey}.${index}`,
          mustacheReplacer(str, data)
        );
      });
    } else if (typeof currentData === 'string') {
      objectPath.set(
        copyBlock.data,
        blockDataKey,
        mustacheReplacer(currentData, data)
      );
    }
  });

  return copyBlock;
}

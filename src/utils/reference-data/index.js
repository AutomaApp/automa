import objectPath from 'object-path';
import cloneDeep from 'lodash.clonedeep';
import mustacheReplacer from './mustache-replacer';

export default function ({ block, refKeys, data }) {
  if (!refKeys || refKeys.length === 0) return block;

  const copyBlock = cloneDeep(block);
  const addReplacedValue = (value) => {
    if (!copyBlock.replacedValue) copyBlock.replacedValue = {};

    copyBlock.replacedValue = { ...copyBlock.replacedValue, ...value };
  };

  refKeys.forEach((blockDataKey) => {
    const currentData = objectPath.get(copyBlock.data, blockDataKey);

    if (!currentData) return;

    if (Array.isArray(currentData)) {
      currentData.forEach((str, index) => {
        const replacedStr = mustacheReplacer(str, data);

        addReplacedValue(replacedStr.list);
        objectPath.set(
          copyBlock.data,
          `${blockDataKey}.${index}`,
          replacedStr.value
        );
      });
    } else if (typeof currentData === 'string') {
      const replacedStr = mustacheReplacer(currentData, data);

      addReplacedValue(replacedStr.list);
      objectPath.set(copyBlock.data, blockDataKey, replacedStr.value);
    }
  });

  return copyBlock;
}

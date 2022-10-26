import objectPath from 'object-path';
import cloneDeep from 'lodash.clonedeep';
import renderString from './renderString';

export default async function ({ block, refKeys, data }) {
  if (!refKeys || refKeys.length === 0) return block;

  const copyBlock = cloneDeep(block);
  const addReplacedValue = (value) => {
    if (!copyBlock.replacedValue) copyBlock.replacedValue = {};
    copyBlock.replacedValue = { ...copyBlock.replacedValue, ...value };
  };

  for (const blockDataKey of refKeys) {
    const currentData = objectPath.get(copyBlock.data, blockDataKey);
    /* eslint-disable-next-line */
    if (!currentData) continue;

    if (Array.isArray(currentData)) {
      for (let index = 0; index < currentData.length; index += 1) {
        const value = currentData[index];
        const renderedValue = await renderString(value, data);

        addReplacedValue(renderedValue.list);
        objectPath.set(
          copyBlock.data,
          `${blockDataKey}.${index}`,
          renderedValue.value
        );
      }
    } else if (typeof currentData === 'string') {
      const renderedValue = await renderString(currentData, data);

      addReplacedValue(renderedValue.list);
      objectPath.set(copyBlock.data, blockDataKey, renderedValue.value);
    }
  }

  return copyBlock;
}

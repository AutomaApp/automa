import handleSelector from '../handleSelector';

async function saveAssets(block) {
  let elements = await handleSelector(block, { returnElement: true });

  if (!elements) {
    throw new Error('element-not-found');
  }

  elements = block.data.multiple ? Array.from(elements) : [elements];

  const srcList = elements.reduce((acc, element) => {
    const tag = element.tagName;

    if ((tag === 'AUDIO' || tag === 'VIDEO') && !tag.src) {
      const sourceEl = element.querySelector('source');

      if (sourceEl && sourceEl.src) acc.push(sourceEl.src);
    } else if (element.src) {
      acc.push(element.src);
    }

    return acc;
  }, []);

  return srcList;
}

export default saveAssets;

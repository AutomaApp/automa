import { nanoid } from 'nanoid';
import handleSelector from '../handleSelector';
import { generateLoopSelectors } from '../utils';

export default async function loopElements(block) {
  const elements = await handleSelector(block);
  if (!elements) throw new Error('element-not-found');

  let frameSelector = '';
  if (block.data.$frameSelector) {
    frameSelector = `${block.data.$frameSelector} |> `;
  }

  if (block.onlyGenerate) {
    generateLoopSelectors(elements, {
      ...block.data,
      frameSelector,
      attrId: block.data.loopId,
    });

    return {};
  }

  const attrId = `${block.id}-${nanoid(5)}`;
  const selectors = generateLoopSelectors(elements, {
    ...block.data,
    frameSelector,
    attrId,
  });
  const { origin, pathname } = window.location;

  return {
    loopId: attrId,
    elements: selectors,
    url: origin + pathname,
  };
}

import { nanoid } from 'nanoid';
import handleSelector from '../handleSelector';

function generateLoopSelectors(elements, { max, attrId, frameSelector }) {
  const selectors = [];

  elements.forEach((el, index) => {
    if (max > 0 && selectors.length - 1 > max) return;

    const attrName = 'automa-loop';
    const attrValue = `${attrId}--${index}`;

    el.setAttribute(attrName, attrValue);
    selectors.push(`${frameSelector}[${attrName}="${attrValue}"]`);
  });

  return selectors;
}

export default async function loopElements(block) {
  const elements = await handleSelector(block);
  if (!elements) throw new Error('element-not-found');
  console.log(block);
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

  const attrId = nanoid(5);
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

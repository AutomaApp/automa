import { nanoid } from 'nanoid';
import handleSelector from '../handleSelector';

export default async function loopElements(block) {
  const elements = await handleSelector(block);
  const selectors = [];
  const attrId = nanoid(5);

  let frameSelector = '';

  if (block.data.$frameSelector) {
    frameSelector = `${block.data.$frameSelector} |> `;
  }

  elements.forEach((el, index) => {
    if (block.data.max > 0 && selectors.length - 1 > block.data.max) return;

    const attrName = 'automa-loop';
    const attrValue = `${attrId}--${index}`;

    el.setAttribute(attrName, attrValue);
    selectors.push(`${frameSelector}[${attrName}="${attrValue}"]`);
  });

  return selectors;
}

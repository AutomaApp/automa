import { finder as finderLib } from '@medv/finder';

const ariaAttrs = ['data-testid'];

export const finder = finderLib;

export default function (element, options = {}) {
  let selector = finder(element, {
    tagName: () => true,
    attr: (name, value) => name === 'id' || (ariaAttrs.includes(name) && value),
    ...options,
  });

  const tag = element.tagName.toLowerCase();
  if (!selector.startsWith(tag) && !selector.includes(' ')) {
    selector = `${tag}${selector}`;
  }

  return selector;
}

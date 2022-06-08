import { finder as finderLib } from '@medv/finder';

const ariaAttrs = ['aria-label', 'aria-labelledby'];

export const finder = finderLib;

export default function (element, options = {}) {
  return finder(element, {
    tagName: () => true,
    attr: (name, value) => name === 'id' || (ariaAttrs.includes(name) && value),
    ...options,
  });
}

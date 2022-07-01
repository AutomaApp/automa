import { finder as finderLib } from '@medv/finder';

const ariaAttrs = ['aria-label', 'aria-labelledby'];

export const finder = finderLib;

export default function (element, options = {}) {
  let selector = finder(element, {
    tagName: (name) => {
      console.log(name);
      return true;
    },
    attr: (name, value) => name === 'id' || (ariaAttrs.includes(name) && value),
    ...options,
  });
  console.log({
    tagName: (name) => {
      console.log(name);
      return true;
    },
    attr: (name, value) => name === 'id' || (ariaAttrs.includes(name) && value),
    ...options,
  });

  const tag = element.tagName.toLowerCase();
  if (!selector.startsWith(tag) && !selector.includes(' ')) {
    selector = `${tag}${selector}`;
  }

  return selector;
}

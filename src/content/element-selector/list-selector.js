/* eslint-disable  no-cond-assign */
import { getCssSelector } from 'css-selector-generator';

export function getAllSiblings(el, selector) {
  const siblings = [el];
  const validateElement = (element) => {
    const isValidSelector = selector ? element.querySelector(selector) : true;
    const isSameTag = el.tagName === element.tagName;

    return isValidSelector && isSameTag;
  };

  let nextSibling = el;
  let prevSibling = el;
  let elementIndex = 1;

  while ((prevSibling = prevSibling?.previousElementSibling)) {
    if (validateElement(prevSibling)) {
      elementIndex += 1;

      siblings.unshift(prevSibling);
    }
  }
  while ((nextSibling = nextSibling?.nextElementSibling)) {
    if (validateElement(nextSibling)) siblings.push(nextSibling);
  }

  return {
    elements: siblings,
    index: elementIndex,
  };
}

export default function (el, maxDepth = 50, paths = []) {
  if (maxDepth === 0) return null;

  let selector = el.tagName.toLowerCase();
  const { elements: siblings, index } = getAllSiblings(el, paths.join(' > '));

  if (siblings.length > 1 && index > 1) selector += `:nth-of-type(${index})`;

  paths.unshift(selector);

  if (siblings.length === 1) {
    el = el.parentElement;
    getElementList(el, maxDepth - 1, paths);
  }

  const parentSelector = getCssSelector(el);
  const listSelector = `${parentSelector} ${paths.join(' > ')}`;

  return listSelector;
}

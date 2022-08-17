import findSelector from '@/lib/findSelector';

/* eslint-disable  no-cond-assign */
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
    if (validateElement(nextSibling)) {
      siblings.push(nextSibling);
    }
  }

  return {
    elements: siblings,
    index: elementIndex,
  };
}

export function getCssPath(el, root = document.body) {
  if (!el) return null;

  const path = [];

  while (el.nodeType === Node.ELEMENT_NODE && !el.isSameNode(root)) {
    let selector = el.nodeName.toLowerCase();

    if (el.id) {
      selector += `#${el.id}`;

      path.unshift(selector);
    } else {
      let nth = 1;
      let sib = el;

      while ((sib = sib.previousElementSibling)) {
        if (sib.nodeName.toLowerCase() === selector) nth += 1;
      }

      if (nth !== 1) selector += `:nth-of-type(${nth})`;

      path.unshift(selector);
    }

    el = el.parentNode;
  }

  return path.join(' > ');
}

export function getElementList(el, maxDepth = 50, paths = []) {
  if (maxDepth === 0 || !el || el.tagName === 'BODY') return null;

  let selector = el.tagName.toLowerCase();
  const { elements, index } = getAllSiblings(el, paths.join(' > '));
  let siblings = elements;

  if (index !== 1) selector += `:nth-of-type(${index})`;

  paths.unshift(selector);

  if (siblings.length === 1) {
    siblings = getElementList(el.parentElement, maxDepth - 1, paths);
  }

  return siblings;
}

export default function (
  target,
  { frameElement, onlyInList, selectorSettings } = {}
) {
  if (!target) return [];

  const automaListEl = target.closest('[automa-el-list]');
  let documentCtx = document;

  if (frameElement) {
    documentCtx = frameElement.contentDocument;
  }

  if (automaListEl) {
    if (target.hasAttribute('automa-el-list')) return [];

    const childSelector = findSelector(target, {
      root: automaListEl,
      ...(selectorSettings || {}),
      idName: () => false,
    });
    const elements = documentCtx.querySelectorAll(
      `[automa-el-list] ${childSelector}`
    );

    return Array.from(elements);
  }

  if (onlyInList) return [];

  return getElementList(target) || [target];
}

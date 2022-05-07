import FindElement from '@/utils/FindElement';
import { scrollIfNeeded } from '@/utils/helper';

/* eslint-disable consistent-return */

export function markElement(el, { id, data }) {
  if (data.markEl) {
    el.setAttribute(`block--${id}`, '');
  }
}

export function queryElements(data, documentCtx = document) {
  return new Promise((resolve) => {
    let timeout = null;
    let isTimeout = false;

    const findSelector = () => {
      if (isTimeout) return;

      const selectorType = data.findBy || 'cssSelector';
      const elements = FindElement[selectorType](data, documentCtx);
      const isElNotFound = !elements || elements.length === 0;

      if (isElNotFound && data.waitForSelector) {
        setTimeout(findSelector, 200);
      } else {
        clearTimeout(timeout);
        resolve(elements);
      }
    };

    findSelector();

    if (data.waitForSelector) {
      timeout = setTimeout(() => {
        isTimeout = true;
        resolve(null);
      }, data.waitSelectorTimeout);
    }
  });
}

export function getDocumentCtx(frameSelector) {
  let documentCtx = document;

  if (frameSelector) {
    documentCtx = document.querySelector(frameSelector)?.contentDocument;
  }

  return documentCtx;
}

export default async function (
  { data, id, frameSelector, debugMode },
  { onSelected, onError, onSuccess }
) {
  if (!data || !data.selector) {
    if (onError) onError(new Error('selector-empty'));
    return null;
  }

  const documentCtx = getDocumentCtx(frameSelector);
  if (!documentCtx) {
    if (onError) onError(new Error('iframe-not-found'));

    return null;
  }

  try {
    data.blockIdAttr = `block--${id}`;

    const elements = await queryElements(data, documentCtx);

    if (!elements || elements.length === 0) {
      if (onError) onError(new Error('element-not-found'));

      return null;
    }

    if (data.multiple) {
      await Promise.allSettled(
        Array.from(elements).map((el) => {
          markElement(el, { id, data });
          if (debugMode) scrollIfNeeded(el);
          return onSelected(el);
        })
      );
    } else if (elements) {
      markElement(elements, { id, data });
      if (debugMode) scrollIfNeeded(elements);
      await onSelected(elements);
    }

    if (onSuccess) onSuccess();

    return elements;
  } catch (error) {
    console.error(error);
  }

  return elements;
}

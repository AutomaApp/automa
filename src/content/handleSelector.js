import FindElement from '@/utils/FindElement';
import { visibleInViewport, isXPath } from '@/utils/helper';

/* eslint-disable consistent-return */

export function markElement(el, { id, data }) {
  if (data.markEl) {
    el.setAttribute(`block--${id}`, '');
  }
}

export function getDocumentCtx(frameSelector) {
  let documentCtx = document;

  if (frameSelector) {
    const type = isXPath(frameSelector) ? 'xpath' : 'cssSelector';
    const element = FindElement[type]({ selector: frameSelector });
    documentCtx = element?.contentDocument;
  }

  return documentCtx;
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
        if (timeout) clearTimeout(timeout);
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

export default async function (
  { data, id, frameSelector, debugMode },
  { onSelected, onError, onSuccess, withDocument } = {}
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

    const elementsArr = data.multiple ? Array.from(elements) : [elements];

    await Promise.allSettled(
      elementsArr.map(async (el) => {
        markElement(el, { id, data });

        if (debugMode) {
          const isInViewport = visibleInViewport(el);
          if (!isInViewport) el.scrollIntoView();
        }

        if (onSelected) await onSelected(el);
      })
    );

    if (onSuccess) onSuccess();
    if (withDocument) {
      return {
        elements,
        document: documentCtx,
      };
    }

    return elements;
  } catch (error) {
    if (onError) onError(error);

    throw error;
  }
}

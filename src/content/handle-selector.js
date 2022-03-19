import FindElement from '@/utils/find-element';

/* eslint-disable consistent-return */

export function markElement(el, { id, data }) {
  if (data.markEl) {
    el.setAttribute(`block--${id}`, '');
  }
}

export function waitForSelector({
  timeout,
  selector,
  documentCtx = document,
} = {}) {
  return new Promise((resolve) => {
    let isTimeout = false;
    const findSelector = () => {
      if (isTimeout) return;

      const element = documentCtx.querySelector(selector);

      if (!element) {
        setTimeout(findSelector, 200);
      } else {
        resolve(element);
      }
    };

    findSelector();

    setTimeout(() => {
      isTimeout = true;
      resolve(null);
    }, timeout);
  });
}

function scrollIfNeeded(debugMode, element) {
  if (!debugMode) return;

  const { top, left, bottom, right } = element.getBoundingClientRect();
  const isInViewport =
    top >= 0 &&
    left >= 0 &&
    bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    right <= (window.innerWidth || document.documentElement.clientWidth);

  if (!isInViewport) {
    element.scrollIntoView();
  }
}

export default async function (
  { data, id, frameSelector, debugMode },
  { onSelected, onError, onSuccess, returnElement }
) {
  if (!data || !data.selector) {
    if (onError) onError(new Error('selector-empty'));
    return null;
  }

  let documentCtx = document;

  if (frameSelector) {
    const iframeCtx = document.querySelector(frameSelector)?.contentDocument;

    if (!iframeCtx && returnElement) return null;
    if (!iframeCtx && onError) {
      onError(new Error('iframe-not-found'));
      return;
    }

    documentCtx = iframeCtx;
  }

  if (data.waitForSelector && data.findBy === 'cssSelector') {
    const element = await waitForSelector({
      documentCtx,
      selector: data.selector,
      timeout: data.waitSelectorTimeout,
    });

    if (!element) {
      if (returnElement) return element;

      if (onError) {
        onError(new Error('element-not-found'));
        return;
      }
    }
  }

  try {
    data.blockIdAttr = `block--${id}`;

    const selectorType = data.findBy || 'cssSelector';
    const element = FindElement[selectorType](data, documentCtx);

    if (returnElement) return element;

    if (!element) {
      if (onError) onError(new Error('element-not-found'));

      return null;
    }

    if (data.multiple && selectorType === 'cssSelector') {
      await Promise.allSettled(
        Array.from(element).map((el) => {
          markElement(el, { id, data });
          scrollIfNeeded(debugMode, el);
          return onSelected(el);
        })
      );
    } else if (element) {
      markElement(element, { id, data });
      scrollIfNeeded(debugMode, element);
      await onSelected(element);
    }

    if (onSuccess) onSuccess();
  } catch (error) {
    console.error(error);
  }
}

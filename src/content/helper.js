/* eslint-disable consistent-return */

export function markElement(el, { id, data }) {
  if (data.markEl) {
    el.setAttribute(`block--${id}`, '');
  }
}

export function handleElement({ data, id }, callback, errCallback) {
  if (!data || !data.selector) return null;

  try {
    const blockIdAttr = `block--${id}`;
    const selector = data.markEl
      ? `${data.selector.trim()}:not([${blockIdAttr}])`
      : data.selector;

    const element = data.multiple
      ? document.querySelectorAll(selector)
      : document.querySelector(selector);

    if (typeof callback === 'boolean' && callback) return element;

    if (data.multiple) {
      element.forEach((el) => {
        markElement(el, { id, data });
        callback(el);
      });
    } else if (element) {
      markElement(element, { id, data });
      callback(element);
    } else if (errCallback) {
      errCallback();
    }
  } catch (error) {
    console.error(error);
  }
}

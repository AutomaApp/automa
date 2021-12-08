import FindElement from '@/utils/find-element';

/* eslint-disable consistent-return */

export function markElement(el, { id, data }) {
  if (data.markEl) {
    el.setAttribute(`block--${id}`, '');
  }
}

export function handleElement({ data, id }, callback, errCallback) {
  if (!data || !data.selector) return null;

  try {
    data.blockIdAttr = `block--${id}`;
    const element = FindElement[data.findBy || 'cssSelector'](data);

    if (typeof callback === 'boolean' && callback) return element;

    if (data.multiple && (data.findBy || 'cssSelector') === 'cssSelector') {
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

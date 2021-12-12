import FindElement from '@/utils/find-element';

/* eslint-disable consistent-return */

export function markElement(el, { id, data }) {
  if (data.markEl) {
    el.setAttribute(`block--${id}`, '');
  }
}

export function handleElement(
  { data, id },
  { onSelected, onError, onSuccess, returnElement }
) {
  if (!data || !data.selector) return null;

  try {
    data.blockIdAttr = `block--${id}`;

    const selectorType = data.findBy || 'cssSelector';
    const element = FindElement[selectorType](data);

    if (returnElement) return element;

    if (!element) {
      if (onError) onError();

      return;
    }
    console.log(element, onSelected);
    if (data.multiple && selectorType === 'cssSelector') {
      element.forEach((el) => {
        markElement(el, { id, data });
        onSelected(el);
      });
    } else if (element) {
      markElement(element, { id, data });
      onSelected(element);
    }

    if (onSuccess) onSuccess();
  } catch (error) {
    console.error(error);
  }
}

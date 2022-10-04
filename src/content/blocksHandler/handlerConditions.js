import { visibleInViewport, isXPath } from '@/utils/helper';
import handleSelector from '../handleSelector';

async function handleConditionElement({ data, type, id, frameSelector }) {
  const selectorType = isXPath(data.selector) ? 'xpath' : 'cssSelector';

  const element = await handleSelector({
    id,
    data: {
      ...data,
      findBy: selectorType,
    },
    frameSelector,
    type: selectorType,
  });
  const { 1: actionType } = type.split('#');

  const elementActions = {
    exists: () => Boolean(element),
    notExists: () => !element,
    text: () => element?.innerText ?? null,
    visibleScreen: () => {
      if (!element) return false;

      return visibleInViewport(element);
    },
    visible: () => {
      if (!element) return false;

      const { visibility, display } = getComputedStyle(element);

      return visibility !== 'hidden' && display !== 'none';
    },
    invisible: () => {
      if (!element) return false;

      const { visibility, display } = getComputedStyle(element);
      const styleHidden = visibility === 'hidden' || display === 'none';

      return styleHidden || !visibleInViewport(element);
    },
    attribute: ({ attrName }) => {
      if (!element || !element.hasAttribute(attrName)) return null;

      return element.getAttribute(attrName);
    },
  };

  return elementActions[actionType](data);
}

export default async function (data) {
  let result = null;

  if (data.type.startsWith('element')) {
    result = await handleConditionElement(data);
  }

  return result;
}

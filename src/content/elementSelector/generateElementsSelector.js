import { finder } from '@medv/finder';
import { generateXPath } from '../utils';

export default function ({
  list,
  target,
  selectorType,
  hoveredElements,
  frameElement,
}) {
  let selector = '';

  const [selectedElement] = hoveredElements;
  const finderOptions = {};
  let documentCtx = document;

  if (frameElement) {
    documentCtx = frameElement.contentDocument.body;
    finderOptions.root = documentCtx;
  }

  if (list) {
    const isInList = target.closest('[automa-el-list]');

    if (isInList) {
      const childSelector = finder(target, {
        root: isInList,
        idName: () => false,
      });
      const listSelector = isInList.getAttribute('automa-el-list');

      selector = `${listSelector} ${childSelector}`;
    } else {
      const parentSelector = finder(
        selectedElement.parentElement,
        finderOptions
      );
      selector = `${parentSelector} > ${selectedElement.tagName.toLowerCase()}`;

      const prevSelectedList = documentCtx.querySelectorAll('[automa-el-list]');
      prevSelectedList.forEach((el) => {
        el.removeAttribute('automa-el-list');
      });

      hoveredElements.forEach((el) => {
        el.setAttribute('automa-el-list', selector);
      });
    }
  } else {
    selector =
      selectorType === 'css'
        ? finder(selectedElement, finderOptions)
        : generateXPath(selectedElement);
  }

  return selector;
}

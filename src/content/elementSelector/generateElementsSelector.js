import { finder } from '@medv/finder';
import { generateXPath } from '../utils';

export default function ({ list, target, selectorType, hoveredElements }) {
  let selector = '';
  const [selectedElement] = hoveredElements;

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
      selector = `${finder(
        selectedElement.parentElement
      )} > ${selectedElement.tagName.toLowerCase()}`;

      const prevSelectedList = document.querySelectorAll('[automa-el-list]');
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
        ? finder(selectedElement)
        : generateXPath(selectedElement);
  }

  return selector;
}

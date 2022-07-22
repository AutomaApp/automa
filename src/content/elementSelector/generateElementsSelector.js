import findSelector from '@/lib/findSelector';
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
      const childSelector = findSelector(target, {
        root: isInList,
        idName: () => false,
      });
      const listSelector = isInList.getAttribute('automa-el-list');

      selector = `${listSelector} ${childSelector}`;
    } else {
      const parentSelector = findSelector(
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
    const tagName = selectedElement.tagName.toLowerCase();
    const candidate = findSelector(selectedElement, finderOptions);
    selector =
      selectorType === 'css'
        ? `${candidate.startsWith(tagName) ? '' : tagName}${candidate}`
        : generateXPath(selectedElement);
  }

  return selector;
}

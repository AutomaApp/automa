import findElementList from './listSelector';
import generateElementsSelector from './generateElementsSelector';

let hoveredElements = [];
let prevSelectedElement = null;

function elementRect(element, offset) {
  const { x, y, height, width } = element.getBoundingClientRect();
  const rect = {
    width: width + 4,
    height: height + 4,
    y: y + offset.top - 2,
    x: x + offset.left - 2,
  };

  return rect;
}
function getElementsRect(data) {
  const [element] = document.elementsFromPoint(
    data.clientX - data.left,
    data.clientY - data.top
  );
  if ((!element || element === prevSelectedElement) && !data.click) return;

  const payload = {
    elements: [],
    type: 'automa:iframe-element-rect',
  };

  if (data.click) {
    if (hoveredElements.length === 0) return;

    payload.click = true;

    const [selectedElement] = hoveredElements;
    const selector = generateElementsSelector({
      hoveredElements,
      list: data.list,
      target: selectedElement,
      selectorType: data.selectorType,
    });

    payload.selector = selector;
    payload.elements = hoveredElements.map((el) => elementRect(el, data));
  } else {
    prevSelectedElement = element;
    let elementsRect = [];

    if (data.list) {
      const elements = findElementList(element) || [];

      hoveredElements = elements;
      elementsRect = elements.map((el) => elementRect(el, data));
    } else {
      hoveredElements = [element];
      elementsRect = [elementRect(element, data)];
    }

    payload.elements = elementsRect;
  }

  window.top.postMessage(payload, '*');
}
function resetElementSelector(data) {
  const prevSelectedList = document.querySelectorAll('[automa-el-list]');
  prevSelectedList.forEach((el) => {
    el.removeAttribute('automa-el-list');
  });

  if (data.clearCache) {
    hoveredElements = [];
    prevSelectedElement = null;
  }
}
function onMessage({ data }) {
  if (data.type === 'automa:get-element-rect') getElementsRect(data);
  else if (data.type === 'automa:reset-element-selector')
    resetElementSelector(data);
}

export default function () {
  window.addEventListener('message', onMessage);
}

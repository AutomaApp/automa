import handleSelector from '../handleSelector';

function isElScrollable(element) {
  const excludedTags = ['SCRIPT', 'STYLE', 'SVG', 'HEAD'];

  const isOverflow = /scroll|auto/.test(getComputedStyle(element).overflow);
  const isScrollable =
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth;
  const isExcluded =
    element.tagName.includes('-') || excludedTags.includes(element.tagName);

  return isOverflow && isScrollable && !isExcluded;
}

function findScrollableElement(
  element = document.documentElement,
  dir = 'down',
  maxDepth = 5
) {
  if (maxDepth === 0) return null;

  const isScrollable = isElScrollable(element);
  if (isScrollable) return element;

  if (dir === 'up') {
    const parentEl = element.parentElement;
    if (!parentEl) return null;

    const scrollableElement = findScrollableElement(
      parentEl,
      dir,
      maxDepth - 1
    );
    if (scrollableElement) return scrollableElement;
  } else {
    for (let index = 0; index < element.childElementCount; index += 1) {
      const currentChild = element.children.item(index);
      const scrollableElement = findScrollableElement(
        currentChild,
        dir,
        maxDepth - 1
      );

      if (scrollableElement) return scrollableElement;
    }
  }

  return null;
}

function elementScroll(block) {
  function incScrollPos(element, data, vertical = true) {
    let currentPos = vertical ? element.scrollTop : element.scrollLeft;

    if (data.incY) {
      currentPos += data.scrollY;
    } else if (data.incX) {
      currentPos += data.scrollX;
    }

    return currentPos;
  }

  return new Promise((resolve, reject) => {
    const { data } = block;
    const behavior = data.smooth ? 'smooth' : 'auto';

    handleSelector(block, {
      onSelected(element) {
        if (data.scrollIntoView) {
          element.scrollIntoView({ behavior, block: 'center' });
        } else {
          const scrollableEl =
            findScrollableElement(element, 'up', 3) ||
            findScrollableElement(element, 'down', 3) ||
            element;

          scrollableEl.scroll({
            behavior,
            top: data.incY ? incScrollPos(element, data) : data.scrollY,
            left: data.incX ? incScrollPos(element, data, false) : data.scrollX,
          });
        }
      },
      onError(error) {
        reject(error);
      },
      onSuccess() {
        window.dispatchEvent(new Event('scroll'));
        resolve('');
      },
    });
  });
}

export default elementScroll;

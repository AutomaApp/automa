function findScrollableElement(element = document.body, maxDepth = 3) {
  if (maxDepth === 0) return null;

  const excludeTags = ['SCRIPT', 'STYLE', 'SVG'];
  const isScrollable = element.scrollHeight > window.innerHeight;

  if (isScrollable) return element;

  for (let index = 0; index < element.childElementCount; index += 1) {
    const currentChild = element.children.item(index);
    const isExcluded =
      currentChild.tagName.includes('-') ||
      excludeTags.includes(currentChild.tagName);

    if (!isExcluded) {
      const scrollableElement = findScrollableElement(
        currentChild,
        maxDepth - 1
      );

      if (scrollableElement) return scrollableElement;
    }
  }

  return null;
}

export default async function () {
  findScrollableElement();
}

class FindElement {
  static cssSelector(data) {
    const selector = data.markEl
      ? `${data.selector.trim()}:not([${data.blockIdAttr}])`
      : data.selector;

    if (data.multiple) {
      const elements = document.querySelectorAll(selector);

      if (elements.length === 0) return null;

      return elements;
    }

    return document.querySelector(selector);
  }

  static xpath(data) {
    return document.evaluate(
      data.selector,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
  }
}

export default FindElement;

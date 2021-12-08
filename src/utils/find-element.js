class FindElement {
  static cssSelector(data) {
    const selector = data.markEl
      ? `${data.selector.trim()}:not([${data.blockIdAttr}])`
      : data.selector;

    return data.multiple
      ? document.querySelectorAll(selector)
      : document.querySelector(selector);
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

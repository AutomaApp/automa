class FindElement {
  static cssSelector(data, documentCtx = document) {
    const selector = data.markEl
      ? `${data.selector.trim()}:not([${data.blockIdAttr}])`
      : data.selector;

    if (data.multiple) {
      const elements = documentCtx.querySelectorAll(selector);

      if (elements.length === 0) return null;

      return elements;
    }

    return documentCtx.querySelector(selector);
  }

  static xpath(data, documentCtx = document) {
    const resultType = data.multiple
      ? XPathResult.ORDERED_NODE_ITERATOR_TYPE
      : XPathResult.FIRST_ORDERED_NODE_TYPE;

    let result = null;
    const elements = documentCtx.evaluate(
      data.selector,
      documentCtx,
      null,
      resultType,
      null
    );

    if (data.multiple) {
      result = [];
      let element = elements.iterateNext();

      while (element) {
        result.push(element);

        element = elements.iterateNext();
      }
    } else {
      result = elements.singleNodeValue;
    }

    return result;
  }
}

export default FindElement;

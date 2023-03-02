import Sizzle from 'sizzle';
import {
  querySelectorAllDeep,
  querySelectorDeep,
} from '@/lib/query-selector-shadow-dom';

// Add a custom "Sizzle" pseudo-class selector
// ":contains": element content will be selected as long as it contains text
// ":equal" : element content must be exactly the same as text to be selected
// Example: p.description:equal("cat")
Sizzle.selectors.pseudos.equal = Sizzle.selectors.createPseudo(function (text) {
  return function (elem) {
    const elemText = elem.textContent || elem.innerText || '';
    return elemText.trim() === text;
  };
});

const specialSelectors = [':contains', ':header', ':parent', ':equal'];
const specialSelectorsRegex = new RegExp(specialSelectors.join('|'));

class FindElement {
  static cssSelector(data, documentCtx = document) {
    const selector = data.markEl
      ? `${data.selector.trim()}:not([${data.blockIdAttr}])`
      : data.selector;

    if (specialSelectorsRegex.test(selector)) {
      // Fix Sizzle incorrect context in iframe, passed as context of iframe
      const elements = Sizzle(selector, documentCtx);
      if (!elements) return null;

      return data.multiple ? elements : elements[0];
    }

    if (selector.includes('>>')) {
      const newSelector = selector.replaceAll('>>', '');

      return data.multiple
        ? querySelectorAllDeep(newSelector)
        : querySelectorDeep(newSelector);
    }

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

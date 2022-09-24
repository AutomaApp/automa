import { sleep, isXPath } from '@/utils/helper';
import handleSelector from '../handleSelector';
import { generateLoopSelectors, simulateClickElement } from '../utils';

function getScrollParent(node) {
  const isElement = node instanceof HTMLElement;
  const overflowY = isElement && window.getComputedStyle(node).overflowY;
  const isScrollable = overflowY !== 'visible' && overflowY !== 'hidden';

  if (!node) {
    return null;
  }
  if (isScrollable && node.scrollHeight >= node.clientHeight) {
    return node;
  }

  return (
    getScrollParent(node.parentNode) ||
    document.scrollingElement ||
    document.body
  );
}
function excludeSelector({ type, selector, loopAttr }) {
  if (type === 'cssSelector') {
    return `${selector}:not([automa-loop*="${loopAttr}"])`;
  }

  return `${selector}[not(contains(@automa-loop, 'gku9rbk-qje-F'))]`;
}

export default async function ({ data, id }) {
  try {
    let frameSelector = '';
    if (data.$frameSelector) {
      frameSelector = `${data.$frameSelector} |> `;
    }

    const generateItemsSelector = (elements) => {
      const selectors = generateLoopSelectors(elements, {
        frameSelector,
        attrId: data.loopAttrId,
        startIndex: data.index + 1,
      });

      return selectors;
    };
    const getNewElementsOptions = {
      id,
      data: {
        multiple: true,
        findBy: data.findBy,
        waitForSelector: true,
        waitSelectorTimeout: data.actionElMaxWaitTime * 1000,
        selector: excludeSelector({
          type: data.findBy,
          selector: data.selector,
          loopAttr: data.loopAttrId,
        }),
      },
    };
    let elements = null;

    if (data.type === 'scroll') {
      const loopItems = document.querySelectorAll(
        `[automa-loop*="${data.loopAttrId}"]`
      );
      if (loopItems.length === 0) return { continue: true };

      const scrollableParent = getScrollParent(loopItems[0]);
      if (!scrollableParent) return { continue: true };

      if (data.scrollToBottom) {
        const { scrollHeight } = scrollableParent;
        scrollableParent.scrollTo(0, scrollHeight + 30);
      } else {
        const lastElement = loopItems[loopItems.length - 1];
        lastElement.scrollIntoView();
      }

      await sleep(500);

      elements = await handleSelector(getNewElementsOptions);
    } else if (['click-element', 'click-link'].includes(data.type)) {
      const elementForLoad = await handleSelector({
        id,
        data: {
          waitForSelector: true,
          waitSelectorTimeout: 2000,
          selector: data.actionElSelector,
          findBy: isXPath(data.actionElSelector),
        },
      });
      if (!elementForLoad) return { continue: true };

      if (data.type === 'click-element') {
        simulateClickElement(elementForLoad);
        await sleep(500);

        elements = await handleSelector(getNewElementsOptions);
      } else {
        if (data.onlyClickLink) {
          if (elementForLoad.tagName !== 'A' || !elementForLoad.href)
            return { continue: true };

          window.location.href = elementForLoad.href;

          return {};
        }
        elements = await handleSelector(getNewElementsOptions);
      }
    }

    if (!elements) return { continue: true };

    return generateItemsSelector(elements);
  } catch (error) {
    console.error(error);
    return { continue: true };
  }
}

import browser from 'webextension-polyfill';
import { isXPath, debounce } from '@/utils/helper';
import { sendMessage } from '@/utils/message';
import FindElement from '@/utils/FindElement';

const observeElements = {};

const targetMutationCallback = debounce(([{ target }]) => {
  let workflowId = target.getAttribute('automa-id');

  if (!workflowId) {
    const element = target.closest('[automa-id]');
    if (!element) return;
    workflowId = element.getAttribute('automa-id');
  }
  if (!observeElements[workflowId]) return;

  const { workflow } = observeElements[workflowId];
  workflow.includeTabId = true;

  sendMessage('workflow:execute', workflow, 'background');
}, 250);
const targetObserver = new MutationObserver(targetMutationCallback);

const baseMutationCallback = debounce(() => {
  targetObserver.disconnect();
  Object.values(observeElements).forEach((detail) => {
    /* eslint-disable-next-line */
    tryObserve({ ...detail, observer: targetObserver });
  });
}, 250);
const baseObserver = new MutationObserver(baseMutationCallback);

export function matchPatternToRegex(str) {
  const regexStr = str.replace(/[*?^$]/g, (char) => {
    if (char === '*') return '[a-zA-Z0-9]*';

    return `\\${char}`;
  });
  const regex = new RegExp(regexStr);

  return regex;
}
function tryObserve({ selector, observer, options, id }) {
  let tryCount = 0;

  const findElement = () => {
    if (tryCount > 10) return;

    const selectorType = isXPath(selector) ? 'xpath' : 'cssSelector';
    const element = FindElement[selectorType]({ selector });

    if (!element) {
      tryCount += 1;
      setTimeout(findElement, 1000);
      return;
    }

    if (id) element.setAttribute('automa-id', id);

    if (!options.attributes || options.attributeFilter.length === 0)
      delete options.attributeFilter;
    observer.observe(element, options);
  };

  findElement();
}

export default async function () {
  const { workflows } = await browser.storage.local.get('workflows');
  workflows.forEach(({ trigger, id, ...workflowDetail }) => {
    if (
      !trigger ||
      trigger.type !== 'element-change' ||
      !trigger.observeElement?.selector ||
      !trigger.observeElement?.matchPattern
    )
      return;

    const {
      baseSelector,
      baseElOptions,
      selector,
      targetOptions,
      matchPattern,
    } = trigger.observeElement;

    const regex = matchPatternToRegex(matchPattern);
    if (!regex.test(window.location.href)) return;

    if (baseSelector)
      tryObserve({
        selector: baseSelector,
        options: baseElOptions,
        observer: baseObserver,
      });

    observeElements[id] = {
      id,
      selector,
      options: targetOptions,
      workflow: { id, trigger, ...workflowDetail },
    };
    tryObserve({
      selector,
      options: targetOptions,
      observer: targetObserver,
      id,
    });
  });
}

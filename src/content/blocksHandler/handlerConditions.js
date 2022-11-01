import { customAlphabet } from 'nanoid/non-secure';
import { visibleInViewport, isXPath } from '@/utils/helper';
import { automaRefDataStr } from '@/workflowEngine/helper';
import handleSelector from '../handleSelector';

const nanoid = customAlphabet('1234567890abcdef', 5);

async function handleConditionElement({ data, type, id, frameSelector }) {
  const selectorType = isXPath(data.selector) ? 'xpath' : 'cssSelector';

  const element = await handleSelector({
    id,
    data: {
      ...data,
      findBy: selectorType,
    },
    frameSelector,
    type: selectorType,
  });
  const { 1: actionType } = type.split('#');

  const elementActions = {
    exists: () => Boolean(element),
    notExists: () => !element,
    text: () => element?.innerText ?? null,
    visibleScreen: () => {
      if (!element) return false;

      return visibleInViewport(element);
    },
    visible: () => {
      if (!element) return false;

      const { visibility, display } = getComputedStyle(element);

      return visibility !== 'hidden' && display !== 'none';
    },
    invisible: () => {
      if (!element) return false;

      const { visibility, display } = getComputedStyle(element);
      const styleHidden = visibility === 'hidden' || display === 'none';

      return styleHidden || !visibleInViewport(element);
    },
    attribute: ({ attrName }) => {
      if (!element || !element.hasAttribute(attrName)) return null;

      return element.getAttribute(attrName);
    },
  };

  return elementActions[actionType](data);
}

async function handleConditionCode({ data, refData }) {
  return new Promise((resolve, reject) => {
    const varName = `automa${nanoid()}`;

    const scriptEl = document.createElement('script');
    scriptEl.textContent = `
      (async () => {
        const ${varName} = ${JSON.stringify(refData)};
        ${automaRefDataStr(varName)}
        try {
          ${data.code}
        } catch (error) {
          return {
            $isError: true,
            message: error.message,
          }
        }
      })()
        .then((detail) => {
          window.dispatchEvent(new CustomEvent('__automa-condition-code__', { detail }));
        });
    `;

    document.body.appendChild(scriptEl);

    const handleAutomaEvent = ({ detail }) => {
      scriptEl.remove();
      window.removeEventListener(
        '__automa-condition-code__',
        handleAutomaEvent
      );

      if (detail.$isError) {
        reject(new Error(detail.message));
        return;
      }

      resolve(detail);
    };

    window.addEventListener('__automa-condition-code__', handleAutomaEvent);
  });
}

export default async function (data) {
  let result = null;

  if (data.type.startsWith('element')) {
    result = await handleConditionElement(data);
  } else if (data.type.startsWith('code')) {
    result = await handleConditionCode(data);
  }

  return result;
}

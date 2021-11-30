/* eslint-disable consistent-return, no-param-reassign */
import simulateEvent from '@/utils/simulate-event';
import handleFormElement from '@/utils/handle-form-element';
import { generateJSON } from '@/utils/data-exporter';

function markElement(el, { id, data }) {
  if (data.markEl) {
    el.setAttribute(`block--${id}`, '');
  }
}
function handleElement({ data, id }, callback, errCallback) {
  if (!data || !data.selector) return null;

  try {
    const blockIdAttr = `block--${id}`;
    const selector = data.markEl
      ? `${data.selector.trim()}:not([${blockIdAttr}])`
      : data.selector;

    const element = data.multiple
      ? document.querySelectorAll(selector)
      : document.querySelector(selector);

    if (typeof callback === 'boolean' && callback) return element;

    if (data.multiple) {
      element.forEach((el) => {
        markElement(el, { id, data });
        callback(el);
      });
    } else if (element) {
      markElement(element, { id, data });
      callback(element);
    } else if (errCallback) {
      errCallback();
    }
  } catch (error) {
    console.error(error);
  }
}

export function switchTo(block) {
  return new Promise((resolve) => {
    handleElement(
      block,
      (element) => {
        if (element.tagName !== 'IFRAME') {
          resolve('');
          return;
        }

        resolve({ url: element.src });
      },
      () => {
        resolve('');
      }
    );
  });
}

export function eventClick(block) {
  return new Promise((resolve) => {
    handleElement(block, (element) => {
      element.click();
    });

    resolve('');
  });
}

export function getText(block) {
  return new Promise((resolve) => {
    let regex;
    const { regex: regexData, regexExp, prefixText, suffixText } = block.data;
    const textResult = [];

    if (regexData) {
      regex = new RegExp(regexData, regexExp.join(''));
    }

    handleElement(block, (element) => {
      let text = element.innerText;

      if (regex) text = text.match(regex).join(' ');

      text = (prefixText || '') + text + (suffixText || '');

      textResult.push(text);
    });

    resolve(textResult);
  });
}

export function javascriptCode(block) {
  block.refData.dataColumns = generateJSON(
    Object.keys(block.refData.dataColumns),
    block.refData.dataColumns
  );

  sessionStorage.setItem(`automa--${block.id}`, JSON.stringify(block.refData));
  const automaScript = `
function automaNextBlock(data) {
  window.dispatchEvent(new CustomEvent('__automa-next-block__', { detail: data }));
}
function automaResetTimeout() {
 window.dispatchEvent(new CustomEvent('__automa-reset-timeout__'));
}
function findData(obj, path) {
  const paths = path.split('.');
  const isWhitespace = paths.length === 1 && !/\\S/.test(paths[0]);

  if (paths.length === 0 || isWhitespace) return obj;

  let current = obj;

  for (let i = 0; i < paths.length; i++) {
    if (current[paths[i]] == undefined) {
      return undefined;
    } else {
      current = current[paths[i]];
    }
  }

  return current;
}
function automaRefData(keyword, path = '') {
  const data = JSON.parse(sessionStorage.getItem('automa--${block.id}')) || null;

  if (data === null) return null;

  return findData(data[keyword], path);
}
`;

  return new Promise((resolve) => {
    const isScriptExists = document.getElementById('automa-custom-js');
    const scriptAttr = `block--${block.id}`;

    if (isScriptExists && isScriptExists.hasAttribute(scriptAttr)) {
      resolve('');
      return;
    }

    const script = document.createElement('script');
    let timeout;

    script.setAttribute(scriptAttr, '');
    script.id = 'automa-custom-js';
    script.innerHTML = `(() => {\n${automaScript} ${block.data.code}\n})()`;

    const cleanUp = (data = '') => {
      script.remove();
      sessionStorage.removeItem(`automa--${block.id}`);
      resolve(data);
    };

    window.addEventListener('__automa-next-block__', ({ detail }) => {
      clearTimeout(timeout);
      cleanUp(detail || {});
    });
    window.addEventListener('__automa-reset-timeout__', () => {
      clearTimeout(timeout);

      timeout = setTimeout(cleanUp, block.data.timeout);
    });

    document.body.appendChild(script);

    timeout = setTimeout(cleanUp, block.data.timeout);
  });
}

export function elementScroll(block) {
  function incScrollPos(element, data, vertical = true) {
    let currentPos = vertical ? element.scrollTop : element.scrollLeft;

    if (data.incY) {
      currentPos += data.scrollY;
    } else if (data.incX) {
      currentPos += data.scrollX;
    }

    return currentPos;
  }

  return new Promise((resolve) => {
    const { data } = block;
    const behavior = data.smooth ? 'smooth' : 'auto';

    handleElement(block, (element) => {
      if (data.scrollIntoView) {
        element.scrollIntoView({ behavior, block: 'center' });
      } else {
        element.scroll({
          behavior,
          top: data.incY ? incScrollPos(element, data) : data.scrollY,
          left: data.incX ? incScrollPos(element, data, false) : data.scrollX,
        });
      }
    });

    window.dispatchEvent(new Event('scroll'));

    resolve('');
  });
}

export function attributeValue(block) {
  return new Promise((resolve) => {
    let result = [];
    const { attributeName, multiple } = block.data;
    const isCheckboxOrRadio = (element) => {
      if (element.tagName !== 'INPUT') return false;

      return ['checkbox', 'radio'].includes(element.getAttribute('type'));
    };

    handleElement(block, (element) => {
      const value =
        attributeName === 'checked' && isCheckboxOrRadio(element)
          ? element.checked
          : element.getAttribute(attributeName);

      if (multiple) result.push(value);
      else result = value;
    });

    resolve(result);
  });
}

export function forms(block) {
  return new Promise((resolve) => {
    const { data } = block;
    const elements = handleElement(block, true);

    if (data.multiple) {
      const promises = Array.from(elements).map((element) => {
        return new Promise((eventResolve) => {
          markElement(element, block);
          handleFormElement(element, data, eventResolve);
        });
      });

      Promise.allSettled(promises).then(() => {
        resolve('');
      });
    } else if (elements) {
      markElement(elements, block);
      handleFormElement(elements, data, resolve);
    } else {
      resolve('');
    }
  });
}

export function triggerEvent(block) {
  return new Promise((resolve) => {
    const { data } = block;

    handleElement(block, (element) => {
      simulateEvent(element, data.eventName, data.eventParams);
    });

    resolve(data.eventName);
  });
}

export function link(block) {
  return new Promise((resolve) => {
    const element = document.querySelector(block.data.selector);

    if (!element) {
      resolve('');
      return;
    }

    markElement(element, block);

    const url = element.href;

    if (url) window.location.href = url;

    resolve(url);
  });
}

export function elementExists({ data }) {
  return new Promise((resolve) => {
    let trying = 0;

    function checkElement() {
      if (trying >= (data.tryCount || 1)) {
        resolve(false);
        return;
      }

      const element = document.querySelector(data.selector);

      if (element) {
        resolve(true);
      } else {
        trying += 1;

        setTimeout(checkElement, data.timeout || 500);
      }
    }

    checkElement();
  });
}

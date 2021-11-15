/* eslint-disable consistent-return, no-param-reassign */
import simulateEvent from '@/utils/simulate-event';
import handleFormElement from '@/utils/handle-form-element';

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
    const { data } = block;
    const textResult = [];

    if (data.regex) {
      regex = new RegExp(data.regex, data.regexExp.join(''));
    }

    handleElement(block, (element) => {
      let text = element.innerText;

      if (regex) text = text.match(regex).join(' ');

      textResult.push(text);
    });

    resolve(textResult);
  });
}

function incScrollPos(element, data, vertical = true) {
  let currentPos = vertical ? element.scrollTop : element.scrollLeft;

  if (data.incY) {
    currentPos += data.scrollY;
  } else if (data.incX) {
    currentPos += data.scrollX;
  }

  return currentPos;
}

const automaScript = `
function automaNextBlock(data) {
  window.dispatchEvent(new CustomEvent('__automa-next-block__', { detail: data }));
}
function automaResetTimeout() {
 window.dispatchEvent(new CustomEvent('__automa-reset-timeout__'));
}
`;

export function javascriptCode(block) {
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
    script.innerHTML = `${automaScript} ${block.data.code}`;

    window.addEventListener('__automa-next-block__', ({ detail }) => {
      clearTimeout(timeout);
      script.remove();
      resolve(detail || {});
    });
    window.addEventListener('__automa-reset-timeout__', () => {
      clearTimeout(timeout);

      timeout = setTimeout(() => {
        script.remove();
        resolve('');
      }, block.data.timeout);
    });

    document.body.appendChild(script);

    timeout = setTimeout(() => {
      script.remove();
      resolve('');
    }, block.data.timeout);
  });
}

export function elementScroll(block) {
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
    const result = [];

    handleElement(block, (element) => {
      const value = element.getAttribute(block.data.attributeName);

      result.push(value);
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

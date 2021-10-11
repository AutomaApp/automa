/* eslint-disable consistent-return, no-param-reassign */
import simulateEvent from '@/utils/simulate-event';
import handleFormElement from '@/utils/handle-form-element';

function handleElement(data, callback) {
  if (!data.selector) return null;

  const element = data.multiple
    ? document.querySelectorAll(data.selector)
    : document.querySelector(data.selector);

  if (typeof callback === 'boolean' && callback) return element;

  if (data.multiple) {
    element.forEach(callback);
  } else if (element) {
    callback(element);
  }
}

export function eventClick({ data }) {
  return new Promise((resolve) => {
    handleElement(data, (element) => {
      element.click();
    });

    resolve('');
  });
}

export function getText({ data }) {
  return new Promise((resolve) => {
    let regex;
    let textResult = '';

    if (data.regex) {
      regex = new RegExp(data.regex, data.regexExp.join(''));
    }

    handleElement(data, (element) => {
      let text = element.innerText;

      if (regex) text = text.match(regex).join(' ');

      textResult += `${text} `;
    });

    resolve(textResult);
  });
}

export function elementScroll({ data }) {
  return new Promise((resolve) => {
    handleElement(data, (element) => {
      element.scroll(data.scrollX, data.scrollY);
    });

    resolve('');
  });
}

export function attributeValue({ data }) {
  return new Promise((resolve) => {
    let result = '';

    handleElement(data, (element) => {
      const value = element.getAttribute(data.attributeName);

      window.dispatchEvent(new Event('scroll'));

      result += `${value} `;
    });

    resolve(result);
  });
}

export function forms({ data }) {
  return new Promise((resolve) => {
    const elements = handleElement(data, true);
    console.log(elements, 'form');
    if (data.multiple) {
      const promises = Array.from(elements).map((element) => {
        return new Promise((eventResolve) => {
          handleFormElement(element, data, eventResolve);
        });
      });

      Promise.allSettled(promises).then(() => {
        console.log('hola amigo');
        resolve('');
      });
    } else if (elements) {
      handleFormElement(elements, data, resolve);
    } else {
      resolve();
    }
  });
}

export function triggerEvent({ data }) {
  return new Promise((resolve) => {
    handleElement(data, (element) => {
      simulateEvent(element, data.eventName, data.eventParams);
    });

    resolve('');
  });
}

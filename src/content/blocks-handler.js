/* eslint-disable consistent-return, no-param-reassign */
import simulateEvent from '@/utils/simulate-event';

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

function inputText({ data, element, index = 0, callback }) {
  const noDelay = data.delay === 0;
  const currentChar = data.text[index];

  if (noDelay) {
    element.value = data.text;
  } else {
    element.value += currentChar;
  }

  const code = /\s/.test(currentChar)
    ? 'Space'
    : `key${currentChar.toUpperCase()}`;

  console.log(code, currentChar, element.value);

  if (data.keydownEvent) {
    simulateEvent(element, 'keydown', { code, key: currentChar });
  }
  if (data.keyupEvent) {
    simulateEvent(element, 'keyup', { code, key: currentChar });
  }
  if (data.changeEvent) {
    element.dispatchEvent(new Event('change'));
  }
  if (data.inputEvent) {
    element.dispatchEvent(
      new InputEvent('input', { inputType: 'insertText', data: currentChar })
    );
  }

  if (!noDelay && index + 1 !== data.text.length) {
    setTimeout(() => {
      inputText({ data, element, callback, index: index + 1 });
    }, data.delay);
  } else {
    callback();
  }
}
export function textInput({ data }) {
  return new Promise((resolve) => {
    const elements = handleElement(data, true);
    const textFields = ['INPUT', 'TEXTAREA'];

    if (data.multiple) {
      const promises = Array.from(elements).map((element) => {
        return new Promise((eventResolve) => {
          if (textFields.includes(element.tagName))
            inputText({ data, element, callback: eventResolve });
          else eventResolve();
        });
      });

      Promise.allSettled(promises).then(() => {
        console.log('hola amigo');
        resolve('');
      });
    } else if (textFields.includes(elements.tagName)) {
      inputText({
        element: elements,
        callback: () => {
          console.log('hola amigo 2');
          resolve('');
        },
      });
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

function handleElement(data, callback) {
  if (!data.selector) return;

  const element = data.multiple
    ? document.querySelectorAll(data.selector)
    : document.querySelector(data.selector);

  if (data.multiple) {
    element.forEach(callback);
  } else if (element) {
    callback(element);
  }
}

export function eventClick({ data }) {
  handleElement(data, (element) => {
    element.click();
  });

  return '';
}

export function getText({ data }) {
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

  return textResult;
}

export function elementScroll({ data }) {
  handleElement(data, (element) => {
    element.scroll(data.scrollX, data.scrollY);
  });

  return '';
}

export function attributeValue({ data }) {
  let result = '';

  handleElement(data, (element) => {
    const value = element.getAttribute(data.attributeName);

    result += `${value} `;
  });

  return result;
}

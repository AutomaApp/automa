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

export function eventClick({ data, name }, port) {
  handleElement(data, (element) => {
    element.click();
  });

  port.postMessage({ type: name });
}

export function getText({ data, name }, port) {
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

  port.postMessage({ type: name, data: textResult });
}

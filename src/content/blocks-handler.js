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
    console.log(element);
    element.click();
  });
}

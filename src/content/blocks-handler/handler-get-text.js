import handleSelector from '../handle-selector';

function getText(block) {
  return new Promise((resolve, reject) => {
    let regex;
    let textResult = [];
    const {
      regex: regexData,
      regexExp,
      prefixText,
      suffixText,
      multiple,
      includeTags,
    } = block.data;

    if (regexData) {
      regex = new RegExp(regexData, [...new Set(regexExp)].join(''));
    }

    handleSelector(block, {
      onSelected(element) {
        let text = includeTags ? element.outerHTML : element.innerText;

        if (regex) text = text.match(regex).join(' ');

        text = (prefixText || '') + text + (suffixText || '');

        if (multiple) {
          textResult.push(text);
        } else {
          textResult = text;
        }
      },
      onError(error) {
        reject(error);
      },
      onSuccess() {
        resolve(textResult);
      },
    });
  });
}

export default getText;

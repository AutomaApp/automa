import { handleElement } from '../helper';

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
    } = block.data;

    if (regexData) {
      regex = new RegExp(regexData, regexExp.join(''));
    }

    handleElement(block, {
      onSelected(element) {
        let text = element.innerText;

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

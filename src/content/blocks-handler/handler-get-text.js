import { handleElement } from '../helper';

function getText(block) {
  return new Promise((resolve, reject) => {
    let regex;
    const { regex: regexData, regexExp, prefixText, suffixText } = block.data;
    const textResult = [];

    if (regexData) {
      regex = new RegExp(regexData, regexExp.join(''));
    }

    handleElement(block, {
      onSelected(element) {
        let text = element.innerText;

        if (regex) text = text.match(regex).join(' ');

        text = (prefixText || '') + text + (suffixText || '');

        textResult.push(text);
      },
      onError() {
        reject(new Error('element-not-found'));
      },
      onSuccess() {
        resolve(textResult);
      },
    });
  });
}

export default getText;

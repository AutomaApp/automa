import { handleElement } from '../helper';

function getText(block) {
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

export default getText;

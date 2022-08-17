import handleSelector from '../handleSelector';

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
      useTextContent,
    } = block.data;

    if (regexData) {
      regex = new RegExp(regexData, [...new Set(regexExp)].join(''));
    }

    handleSelector(block, {
      onSelected(element) {
        let text = '';

        if (includeTags) {
          text = element.outerHTML;
        } else if (useTextContent) {
          text = element.textContent;
        } else {
          text = element.innerText;
        }

        if (regex) text = text.match(regex)?.join(' ') ?? text;

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

import { handleElement } from '../helper';

function attributeValue(block) {
  return new Promise((resolve, reject) => {
    let result = [];
    const { attributeName, multiple } = block.data;
    const isCheckboxOrRadio = (element) => {
      if (element.tagName !== 'INPUT') return false;

      return ['checkbox', 'radio'].includes(element.getAttribute('type'));
    };

    handleElement(block, {
      onSelected(element) {
        const value =
          attributeName === 'checked' && isCheckboxOrRadio(element)
            ? element.checked
            : element.getAttribute(attributeName);

        if (multiple) result.push(value);
        else result = value;
      },
      onError() {
        reject(new Error('element-not-found'));
      },
      onSuccess() {
        resolve(result);
      },
    });
  });
}

export default attributeValue;

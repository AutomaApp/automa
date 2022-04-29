import handleSelector from '../handleSelector';

function attributeValue(block) {
  return new Promise((resolve, reject) => {
    let result = [];
    const { attributeName, multiple } = block.data;
    const isCheckboxOrRadio = (element) => {
      if (element.tagName !== 'INPUT') return false;

      return ['checkbox', 'radio'].includes(element.getAttribute('type'));
    };

    handleSelector(block, {
      onSelected(element) {
        let value = element.getAttribute(attributeName);

        if (attributeName === 'checked' && isCheckboxOrRadio(element)) {
          value = element.checked;
        } else if (attributeName === 'href' && element.tagName === 'A') {
          value = element.href;
        }

        if (multiple) result.push(value);
        else result = value;
      },
      onError(error) {
        reject(error);
      },
      onSuccess() {
        resolve(result);
      },
    });
  });
}

export default attributeValue;

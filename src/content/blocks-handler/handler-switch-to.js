import { handleElement } from '../helper';

function switchTo(block) {
  return new Promise((resolve, reject) => {
    handleElement(block, {
      onSelected(element) {
        if (element.tagName !== 'IFRAME') {
          resolve('');
          return;
        }

        resolve({ url: element.src });
      },
      onSuccess() {
        resolve('');
      },
      onError(error) {
        reject(error);
      },
    });
  });
}

export default switchTo;

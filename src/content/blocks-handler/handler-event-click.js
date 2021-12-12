import { handleElement } from '../helper';

function eventClick(block) {
  return new Promise((resolve, reject) => {
    handleElement(block, {
      onSelected(element) {
        element.click();
      },
      onError() {
        reject(new Error('element-not-found'));
      },
      onSuccess() {
        resolve('');
      },
    });

    resolve('');
  });
}

export default eventClick;

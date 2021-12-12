import { handleElement } from '../helper';

function eventClick(block) {
  return new Promise((resolve, reject) => {
    handleElement(block, {
      onSelected(element) {
        element.click();
      },
      onError(error) {
        reject(error);
      },
      onSuccess() {
        resolve('');
      },
    });

    resolve('');
  });
}

export default eventClick;

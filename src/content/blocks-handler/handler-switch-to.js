import { handleElement } from '../helper';

function switchTo(block) {
  return new Promise((resolve) => {
    handleElement(
      block,
      (element) => {
        if (element.tagName !== 'IFRAME') {
          resolve('');
          return;
        }

        resolve({ url: element.src });
      },
      () => {
        resolve('');
      }
    );
  });
}

export default switchTo;

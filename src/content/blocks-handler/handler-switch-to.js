import { handleElement } from '../helper';

function switchTo(block) {
  return new Promise((resolve, reject) => {
    handleElement(block, {
      onSelected(element) {
        console.log(element, element.tagName);
        if (element.tagName !== 'IFRAME') {
          reject(new Error('not-iframe'));
          return;
        }

        const isSameOrigin = element.contentDocument !== null;

        resolve({ url: element.src, isSameOrigin });
      },
      onError(error) {
        reject(error);
      },
    });
  });
}

export default switchTo;

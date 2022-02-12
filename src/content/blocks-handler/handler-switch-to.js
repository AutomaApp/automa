import handleSelector from '../handle-selector';

function switchTo(block) {
  return new Promise((resolve, reject) => {
    handleSelector(block, {
      onSelected(element) {
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

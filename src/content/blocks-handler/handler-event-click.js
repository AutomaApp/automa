import handleSelector from '../handle-selector';

function eventClick(block) {
  return new Promise((resolve, reject) => {
    handleSelector(block, {
      onSelected(element) {
        if (element.click) {
          element.click();
        } else {
          element.dispatchEvent(new PointerEvent('click', { bubbles: true }));
        }
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

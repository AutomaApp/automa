import { handleElement } from '../helper';

function eventClick(block) {
  return new Promise((resolve) => {
    handleElement(block, (element) => {
      element.click();
    });

    resolve('');
  });
}

export default eventClick;

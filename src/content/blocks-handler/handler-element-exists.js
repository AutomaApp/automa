import { handleElement } from '../helper';

function elementExists(block) {
  return new Promise((resolve) => {
    let trying = 0;

    const isExists = () => {
      try {
        const element = handleElement(block, { returnElement: true });

        return !!element;
      } catch (error) {
        console.error(error);
        return false;
      }
    };

    function checkElement() {
      if (trying > (block.data.tryCount || 1)) {
        resolve(false);
        return;
      }

      if (isExists()) {
        resolve(true);
      } else {
        trying += 1;

        setTimeout(checkElement, block.data.timeout || 500);
      }
    }

    checkElement();
  });
}

export default elementExists;

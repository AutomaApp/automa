import handleSelector from '../handleSelector';

function elementExists(block) {
  return new Promise((resolve) => {
    let trying = 0;

    const isExists = async () => {
      try {
        const element = await handleSelector(block, { returnElement: true });

        if (!element) throw new Error('element-not-found');

        return true;
      } catch (error) {
        return false;
      }
    };

    async function checkElement() {
      if (trying > (block.data.tryCount || 1)) {
        resolve(false);
        return;
      }

      const isElementExist = await isExists();

      if (isElementExist) {
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

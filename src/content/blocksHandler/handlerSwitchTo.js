import { isXPath } from '@/utils/helper';
import handleSelector from '../handleSelector';

const framesEl = ['IFRAME', 'FRAME'];

function switchTo(block) {
  return new Promise((resolve, reject) => {
    block.data.findBy = isXPath(block.data.selector) ? 'xpath' : 'cssSelector';

    handleSelector(block, {
      onSelected(element) {
        if (!framesEl.includes(element.tagName)) {
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

import { handleElement, markElement } from '../helper';

function link(block) {
  return new Promise((resolve, reject) => {
    const element = handleElement(block, { returnElement: true });

    if (!element) {
      reject(new Error('element-not-found'));
      return;
    }

    markElement(element, block);

    const url = element.href;

    if (url) window.location.href = url;

    resolve(url);
  });
}

export default link;

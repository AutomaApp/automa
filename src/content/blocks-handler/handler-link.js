import { markElement } from '../helper';

function link(block) {
  return new Promise((resolve) => {
    const element = document.querySelector(block.data.selector);

    if (!element) {
      resolve('');
      return;
    }

    markElement(element, block);

    const url = element.href;

    if (url) window.location.href = url;

    resolve(url);
  });
}

export default link;

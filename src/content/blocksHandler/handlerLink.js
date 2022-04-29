import handleSelector, { markElement } from '../handleSelector';

async function link(block) {
  const element = await handleSelector(block, { returnElement: true });

  if (!element) {
    throw new Error('element-not-found');
  }

  markElement(element, block);

  const url = element.href;

  if (url) window.location.href = url;

  return url;
}

export default link;

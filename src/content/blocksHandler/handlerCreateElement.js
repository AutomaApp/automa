import handleSelector from '../handleSelector';

const positions = {
  after: 'beforeend',
  before: 'afterbegin',
  'next-sibling': 'afterend',
  'prev-sibling': 'beforebegin',
};

function createNode(tag, attrs = {}, content = '') {
  const element = document.createElement(tag);

  Object.keys(attrs).forEach((attr) => {
    element.setAttribute(attr, attrs[attr]);
  });
  element.innerHTML = content;

  return element;
}

async function createElement(block) {
  const targetElement = await handleSelector(block);
  if (!targetElement) throw new Error('element-not-found');

  const { data, id } = block;
  const baseId = `automa-${id}`;

  if (data.insertAt === 'replace') {
    const fragments = createNode('template', {}, data.html);
    targetElement.replaceWith(fragments.content);
  } else {
    targetElement.insertAdjacentHTML(positions[data.insertAt], data.html);
  }

  if (data.css) {
    const style = createNode('style', { id: `${baseId}-style` }, data.css);
    document.body.appendChild(style);
  }

  return true;
}

export default createElement;

import { customAlphabet } from 'nanoid/non-secure';
import handleSelector from '../handleSelector';
import { automaRefDataStr } from '../utils';

const nanoid = customAlphabet('1234567890abcdef', 5);
const positions = {
  after: 'beforeend',
  before: 'afterbegin',
  'next-sibling': 'afterend',
  'prev-sibling': 'beforebegin',
};

function getAutomaScript(refData) {
  const varName = `automa${nanoid()}`;

  const str = `
const ${varName} = ${JSON.stringify(refData)};
${automaRefDataStr(varName)}
function automaSetVariable(name, value) {
  ${varName}.variables[name] = value;
}
function automaExecWorkflow(options = {}) {
  window.dispatchEvent(new CustomEvent('automa:execute-workflow', { detail: options }));
}
  `;

  return str;
}
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

  data.preloadScripts.forEach((item) => {
    const scriptId = `${baseId}-script`;
    const element = createNode(item.type, { id: scriptId }, item.script);

    document.body.appendChild(element);
  });

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

  if (data.javascript) {
    const automaScript = `
      (() => { ${getAutomaScript(block.refData)}\n${data.javascript} })()
    `;
    const script = createNode(
      'script',
      { id: `${baseId}-javascript` },
      automaScript
    );

    document.body.appendChild(script);
  }

  return true;
}

export default createElement;

import { customAlphabet } from 'nanoid/non-secure';
import browser from 'webextension-polyfill';
import { automaRefDataStr } from '../helper';

const nanoid = customAlphabet('1234567890abcdef', 5);

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

async function handleCreateElement(block, { refData }) {
  if (!this.activeTab.id) throw new Error('no-tab');

  const { data } = block;
  const preloadScriptsPromise = await Promise.allSettled(
    data.preloadScripts.map((item) => {
      if (!item.src.startsWith('http'))
        return Promise.reject(new Error('Invalid URL'));

      return fetch(item.src)
        .then((response) => response.text())
        .then((result) => ({ type: item.type, script: result }));
    })
  );
  const preloadScripts = preloadScriptsPromise.reduce((acc, item) => {
    if (item.status === 'rejected') return acc;

    acc.push(item.value);

    return acc;
  }, []);

  data.preloadScripts = preloadScripts;

  const payload = { ...block, data };
  await this._sendMessageToTab(payload, {}, data.runBeforeLoad ?? false);

  if (data.javascript) {
    const automaScript = getAutomaScript({ ...refData, secrets: {} });

    await browser.scripting.executeScript({
      world: 'MAIN',
      args: [data.javascript, block.id, automaScript, preloadScripts],
      target: {
        tabId: this.activeTab.id,
        frameIds: [this.activeTab.frameId || 0],
      },
      func: (code, blockId, $automaScript, $preloadScripts) => {
        const baseId = `automa-${blockId}`;

        $preloadScripts.forEach((item) => {
          const script = document.createElement(item.type);
          script.id = `${baseId}-script`;
          script.textContent = item.script;

          document.body.appendChild(script);
        });

        const script = document.createElement('script');
        script.id = `${baseId}-javascript`;
        script.textContent = `(() => { ${$automaScript}\n${code} })()`;

        document.body.appendChild(script);
      },
    });
  }

  return {
    data: '',
    nextBlockId: this.getBlockConnections(block.id),
  };
}

export default handleCreateElement;

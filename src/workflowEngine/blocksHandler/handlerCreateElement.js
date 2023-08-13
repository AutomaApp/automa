import { customAlphabet } from 'nanoid/non-secure';
import browser from 'webextension-polyfill';
import { automaRefDataStr, checkCSPAndInject } from '../helper';

const nanoid = customAlphabet('1234567890abcdef', 5);

function getAutomaScript(refData) {
  const varName = `automa${nanoid()}`;

  const str = `
const ${varName} = ${JSON.stringify(refData)};
${automaRefDataStr(varName)}
function automaSetVariable(name, value) {
  const variables = ${varName}.variables;
  if (!variables) ${varName}.variables = {}

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

  const isMV3 =
    (data.javascript || data.preloadScripts.length > 0) && !this.engine.isMV2;
  const payload = {
    ...block,
    data: {
      ...data,
      automaScript: getAutomaScript({ ...refData, secrets: {} }),
    },
    preloadCSS: data.preloadScripts.filter((item) => item.type === 'style'),
  };

  if (isMV3) {
    payload.data.dontInjectJS = true;
  }

  await this._sendMessageToTab(payload, {}, data.runBeforeLoad ?? false);

  if (isMV3) {
    const target = {
      tabId: this.activeTab.id,
      frameIds: [this.activeTab.frameId || 0],
    };

    const { debugMode } = this.engine.workflow?.settings || {};
    const result = await checkCSPAndInject(
      {
        target,
        debugMode,
        options: {
          awaitPromise: false,
          returnByValue: false,
        },
      },
      () => {
        let jsPreload = '';
        preloadScripts.forEach((item) => {
          if (item.type === 'style') return;

          jsPreload += `${item.script}\n`;
        });

        const automaScript = payload.data?.automaScript || '';

        return `(() => { ${jsPreload} \n ${automaScript}\n${data.javascript} })()`;
      }
    );

    if (!result.isBlocked) {
      await browser.scripting.executeScript({
        world: 'MAIN',
        target,
        args: [
          data.javascript,
          block.id,
          payload.data?.automaScript || '',
          preloadScripts,
        ],
        func: (code, blockId, $automaScript, $preloadScripts) => {
          const baseId = `automa-${blockId}`;

          $preloadScripts.forEach((item) => {
            if (item.type === 'style') return;

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
  }

  return {
    data: '',
    nextBlockId: this.getBlockConnections(block.id),
  };
}

export default handleCreateElement;

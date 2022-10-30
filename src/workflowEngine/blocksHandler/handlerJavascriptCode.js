import { customAlphabet } from 'nanoid/non-secure';
import browser from 'webextension-polyfill';
import cloneDeep from 'lodash.clonedeep';
import {
  jsContentHandler,
  automaFetchClient,
  jsContentHandlerEval,
} from '../utils/javascriptBlockUtil';
import {
  messageSandbox,
  automaRefDataStr,
  waitTabLoaded,
  sendDebugCommand,
} from '../helper';

const nanoid = customAlphabet('1234567890abcdef', 5);

function getAutomaScript(varName, refData, everyNewTab, isEval = false) {
  let str = `
const ${varName} = ${JSON.stringify(refData)};
${automaRefDataStr(varName)}
function automaSetVariable(name, value) {
  ${varName}.variables[name] = value;
}
function automaNextBlock(data, insert = true) {
  if (${isEval}) {
    $automaResolve({
      columns: { 
        data, 
        insert,
      }, 
      variables: ${varName}.variables, 
    });
  } else{
    document.body.dispatchEvent(new CustomEvent('__automa-next-block__', { detail: { data, insert, refData: ${varName} } }));
  }
}
function automaResetTimeout() {
  if (${isEval}) {
    clearTimeout($automaTimeout);
    $automaTimeout = setTimeout(() => {
      resolve();
    }, $automaTimeoutMs);
  } else {
    document.body.dispatchEvent(new CustomEvent('__automa-reset-timeout__'));
  }
}
function automaFetch(type, resource) {
  return (${automaFetchClient.toString()})('${varName}', { type, resource });
}
  `;

  if (everyNewTab) str = automaRefDataStr(varName);

  return str;
}
async function executeInWebpage(args, target, worker) {
  if (!target.tabId) {
    throw new Error('no-tab');
  }

  if (worker.engine.isMV2) {
    args[0] = cloneDeep(args[0]);

    const result = await worker._sendMessageToTab({
      label: 'javascript-code',
      data: args,
    });

    return result;
  }

  const [isBlockedByCSP] = await browser.scripting.executeScript({
    target,
    func: () => {
      return new Promise((resolve) => {
        const eventListener = ({ srcElement }) => {
          if (!srcElement || srcElement.id !== 'automa-csp') return;
          srcElement.remove();
          resolve(true);
        };
        document.addEventListener('securitypolicyviolation', eventListener);
        const script = document.createElement('script');
        script.id = 'automa-csp';
        script.innerText = 'console.log("...")';

        setTimeout(() => {
          document.removeEventListener(
            'securitypolicyviolation',
            eventListener
          );
          script.remove();
          resolve(false);
        }, 500);

        document.body.appendChild(script);
      });
    },
    world: 'MAIN',
  });

  if (isBlockedByCSP.result) {
    await new Promise((resolve) => {
      chrome.debugger.attach({ tabId: target.tabId }, '1.3', resolve);
    });
    const { 0: blockData, 1: preloadScripts, 3: varName } = args;
    const automaScript = getAutomaScript(
      varName,
      blockData.refData,
      blockData.data.everyNewTab,
      true
    );
    const jsCode = jsContentHandlerEval({
      blockData,
      automaScript,
      preloadScripts,
    });

    const execResult = await sendDebugCommand(
      target.tabId,
      'Runtime.evaluate',
      {
        expression: jsCode,
        userGesture: true,
        awaitPromise: true,
        returnByValue: true,
      }
    );

    const { debugMode } = worker.engine.workflow.settings;
    if (!debugMode) await chrome.debugger.detach({ tabId: target.tabId });

    if (!execResult || !execResult.result) {
      throw new Error('Unable execute code');
    }

    if (execResult.result.subtype === 'error') {
      throw new Error(execResult.description);
    }

    return execResult.result.value || null;
  }

  const [{ result }] = await browser.scripting.executeScript({
    args,
    target,
    world: 'MAIN',
    func: jsContentHandler,
  });

  return result;
}

export async function javascriptCode({ outputs, data, ...block }, { refData }) {
  const nextBlockId = this.getBlockConnections(block.id);

  if (data.everyNewTab) {
    const isScriptExist = this.preloadScripts.some(({ id }) => id === block.id);

    if (!isScriptExist)
      this.preloadScripts.push({ id: block.id, data: cloneDeep(data) });
    if (!this.activeTab.id) return { data: '', nextBlockId };
  } else if (!this.activeTab.id && data.context !== 'background') {
    throw new Error('no-tab');
  }

  const payload = {
    ...block,
    data,
    refData: { variables: {} },
    frameSelector: this.frameSelector,
  };
  if (data.code.includes('automaRefData')) {
    payload.refData = { ...refData, secrets: {} };
  }

  const preloadScriptsPromise = await Promise.allSettled(
    data.preloadScripts.map(async (script) => {
      const { protocol } = new URL(script.src);
      const isValidUrl = /https?/.test(protocol);
      if (!isValidUrl) return null;

      const response = await fetch(script.src);
      if (!response.ok) throw new Error(response.statusText);

      const result = await response.text();

      return {
        script: result,
        id: `automa-script-${nanoid()}`,
        removeAfterExec: script.removeAfterExec,
      };
    })
  );
  const preloadScripts = preloadScriptsPromise.reduce((acc, item) => {
    if (item.status === 'fulfilled') acc.push(item.value);

    return acc;
  }, []);

  const instanceId = `automa${nanoid()}`;
  const automaScript =
    data.everyNewTab && (!data.context || data.context !== 'background')
      ? ''
      : getAutomaScript(instanceId, payload.refData, data.everyNewTab);

  if (data.context !== 'background') {
    await waitTabLoaded({
      tabId: this.activeTab.id,
      ms: this.settings?.tabLoadTimeout ?? 30000,
    });
  }

  const inSandbox =
    BROWSER_TYPE !== 'firefox' &&
    data.context === 'background' &&
    this.engine.isPopup;
  const result = await (inSandbox
    ? messageSandbox('javascriptBlock', {
        instanceId,
        preloadScripts,
        refData: payload.refData,
        blockData: cloneDeep(payload.data),
      })
    : executeInWebpage(
        [payload, preloadScripts, automaScript, instanceId],
        {
          tabId: this.activeTab.id,
          frameIds: [this.activeTab.frameId || 0],
        },
        this
      ));

  if (result) {
    if (result.columns.data?.$error) {
      throw new Error(result.columns.data.message);
    }

    if (result.variables) {
      Object.keys(result.variables).forEach((varName) => {
        this.setVariable(varName, result.variables[varName]);
      });
    }

    if (result.columns.insert && result.columns.data) {
      const params = Array.isArray(result.columns.data)
        ? result.columns.data
        : [result.columns.data];

      this.addDataToColumn(params);
    }
  }

  return {
    nextBlockId,
    data: result?.columns.data || {},
  };
}

export default javascriptCode;

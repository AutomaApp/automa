import { customAlphabet } from 'nanoid/non-secure';
import browser from 'webextension-polyfill';
import cloneDeep from 'lodash.clonedeep';
import { parseJSON, isObject } from '@/utils/helper';
import {
  jsContentHandler,
  automaFetchClient,
  jsContentHandlerEval,
} from '../utils/javascriptBlockUtil';
import {
  waitTabLoaded,
  messageSandbox,
  automaRefDataStr,
  checkCSPAndInject,
} from '../helper';

const nanoid = customAlphabet('1234567890abcdef', 5);

function getAutomaScript({ varName, refData, everyNewTab, isEval = false }) {
  let str = `
const ${varName} = ${JSON.stringify(refData)};
${automaRefDataStr(varName)}
function automaSetVariable(name, value) {
  const variables = ${varName}.variables;
  if (!variables) ${varName}.variables = {}

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

  const { debugMode } = worker.engine.workflow.settings;
  const cspResult = await checkCSPAndInject({ target, debugMode }, () => {
    const { 0: blockData, 1: preloadScripts, 3: varName } = args;
    const automaScript = getAutomaScript({
      varName,
      isEval: true,
      refData: blockData.refData,
      everyNewTab: blockData.data.everyNewTab,
    });
    const jsCode = jsContentHandlerEval({
      blockData,
      automaScript,
      preloadScripts,
    });

    return jsCode;
  });
  if (cspResult.isBlocked) return cspResult.value;

  const [{ result }] = await browser.scripting.executeScript({
    args,
    target,
    world: 'MAIN',
    func: jsContentHandler,
  });

  if (typeof result?.columns?.data === 'string') {
    result.columns.data = parseJSON(result.columns.data, {});
  }

  return result;
}

export async function javascriptCode({ outputs, data, ...block }, { refData }) {
  let nextBlockId = this.getBlockConnections(block.id);

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
    const newRefData = {};
    Object.keys(refData).forEach((keyword) => {
      if (!data.code.includes(keyword)) return;

      newRefData[keyword] = refData[keyword];
    });

    payload.refData = { ...newRefData, secrets: {} };
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
      : getAutomaScript({
          varName: instanceId,
          refData: payload.refData,
          everyNewTab: data.everyNewTab,
        });

  if (data.context !== 'background') {
    await waitTabLoaded({
      tabId: this.activeTab.id,
      ms: this.settings?.tabLoadTimeout ?? 30000,
    });
  }

  const inSandbox =
    (this.engine.isMV2 || this.engine.isPopup) &&
    BROWSER_TYPE !== 'firefox' &&
    data.context === 'background';
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

    let insert = true;
    if (isObject(result.columns.insert)) {
      const { insert: insertData, nextBlockId: inputNextBlockId } =
        result.columns.insert;

      insert = Boolean(insertData);

      if (inputNextBlockId) {
        const customNextBlockId = this.getBlockConnections(inputNextBlockId);
        if (!customNextBlockId)
          throw new Error(`Can't find block with "${inputNextBlockId}" id`);

        nextBlockId = customNextBlockId;
      }
    } else {
      insert = result.columns.insert;
    }

    const columnData = result.columns.data;
    if (insert && columnData) {
      const columnDataObj =
        typeof columnData === 'string'
          ? parseJSON(columnData, null)
          : columnData;
      if (columnDataObj) {
        const params = Array.isArray(columnDataObj)
          ? columnDataObj
          : [columnDataObj];
        this.addDataToColumn(params);
      }
    }
  }

  return {
    nextBlockId,
    data: result?.columns.data || {},
  };
}

export default javascriptCode;

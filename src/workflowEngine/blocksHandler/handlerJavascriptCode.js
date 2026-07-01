import { isObject, parseJSON } from '@/utils/helper';
import { MessageListener } from '@/utils/message';
import cloneDeep from 'lodash.clonedeep';
import { customAlphabet } from 'nanoid/non-secure';
import {
  automaRefDataStr,
  checkCSPAndInject,
  messageSandbox,
  waitTabLoaded,
} from '../helper';
import { automaFetchClient } from '../utils/javascriptBlockUtil';

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
${automaFetchClient.toString()}

function automaFetch(type, resource) {
  return automaFetchClient('${varName}', { type, resource });
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

  // 提取需要的数据并序列化
  const serializedBlockData = JSON.stringify(args[0]);
  const serializedPreloadScripts = JSON.stringify(args[1]);
  const serializedVarName = JSON.stringify(args[3]);

  // 创建一个简单的回调函数字符串
  const callbackFunction = `
    function() {
      try {
        // 解析序列化的数据
        const _blockData = ${serializedBlockData};
        const _preloadScripts = ${serializedPreloadScripts};
        const _varName = ${serializedVarName};

        // 获取自动化脚本
        const _automaScript = (function(_varName, _refData, _everyNewTab, _isEval) {
          // 这里是getAutomaScript的简化版本
          const _automaRefDataStr = function(_varName) {
            return \`
              function findData(obj, path) {
                const paths = path.split('.');
                const isWhitespace = paths.length === 1 && !/\\\\S/.test(paths[0]);
                if (path.startsWith('$last') && Array.isArray(obj)) {
                  paths[0] = obj.length - 1;
                }
                if (paths.length === 0 || isWhitespace) return obj;
                else if (paths.length === 1) return obj[paths[0]];
                let result = obj;
                for (let i = 0; i < paths.length; i++) {
                  if (result[paths[i]] == undefined) {
                    return undefined;
                  } else {
                    result = result[paths[i]];
                  }
                }
                return result;
              }
              function automaRefData(keyword, path = '') {
                const data = \${_varName}[keyword];
                if (!data) return;
                return findData(data, path);
              }
            \`;
          };

          let _str = \`
            const \${_varName} = \${JSON.stringify(_refData)};
            \${_automaRefDataStr(_varName)}
            function automaSetVariable(name, value) {
              const variables = \${_varName}.variables;
              if (!variables) \${_varName}.variables = {}
              \${_varName}.variables[name] = value;
            }
            function automaNextBlock(data, insert = true) {
              if (\${_isEval}) {
                $automaResolve({
                  columns: {
                    data,
                    insert,
                  },
                  variables: \${_varName}.variables,
                });
              } else{
                document.body.dispatchEvent(new CustomEvent('__automa-next-block__', { detail: { data, insert, refData: \${_varName} } }));
              }
            }
            function automaResetTimeout() {
              if (\${_isEval}) {
                clearTimeout($automaTimeout);
                $automaTimeout = setTimeout(() => {
                  resolve();
                }, $automaTimeoutMs);
              } else{
                document.body.dispatchEvent(new CustomEvent('__automa-reset-timeout__'));
              }
            }
            function automaFetchClient(id, { type, resource }) {
              return new Promise((resolve, reject) => {
                const validType = ['text', 'json', 'base64'];
                if (!type || !validType.includes(type)) {
                  reject(new Error('The "type" must be "text" or "json"'));
                  return;
                }
                const eventName = \\\`__automa-fetch-response-\\\${id}__\\\`;
                const eventListener = ({ detail }) => {
                  if (detail.id !== id) return;
                  window.removeEventListener(eventName, eventListener);
                  if (detail.isError) {
                    reject(new Error(detail.result));
                  } else {
                    resolve(detail.result);
                  }
                };
                window.addEventListener(eventName, eventListener);
                window.dispatchEvent(
                  new CustomEvent(\\\`__automa-fetch__\\\`, {
                    detail: {
                      id,
                      type,
                      resource,
                    },
                  })
                );
              });
            }
            function automaFetch(type, resource) {
              return automaFetchClient('\${_varName}', { type, resource });
            }
          \`;

          if (_everyNewTab) _str = _automaRefDataStr(_varName);

          return _str;
        })(_varName, _blockData.refData, _blockData.data.everyNewTab, true);

        // 生成JavaScript代码
        const _jsCode = (function(_blockData, _automaScript, _preloadScripts) {
          // 这里是jsContentHandlerEval的简化版本
          const _preloadScriptsStr = _preloadScripts
            .map(function(item) { return item.script; })
            .join('\\n');

          return \`(() => {
            \${_preloadScriptsStr}
            return new Promise(($automaResolve) => {
              const $automaTimeoutMs = \${_blockData.data.timeout};
              let $automaTimeout = setTimeout(() => {
                $automaResolve();
              }, $automaTimeoutMs);
              \${_automaScript}
              try {
                \${_blockData.data.code}
                \${
                  _blockData.data.code.includes('automaNextBlock')
                    ? ''
                    : 'automaNextBlock()'
                }
              } catch (error) {
                return { columns: { data: { $error: true, message: error.message } } };
              }
            }).catch((error) => {
              return { columns: { data: { $error: true, message: error.message } } };
            });
          })();\`;
        })(_blockData, _automaScript, _preloadScripts);

        return _jsCode;
      } catch (error) {
        console.error('回调函数内部错误:', error);
        throw error;
      }
    }
  `;

  const cspResult = await checkCSPAndInject(
    { target, debugMode },
    callbackFunction
  );

  if (cspResult.isBlocked) {
    return cspResult.value;
  }

  const { 0: blockData, 1: preloadScripts, 3: varName } = args;

  const [{ result }] = await MessageListener.sendMessage(
    'script:execute',
    {
      target,
      blockData,
      preloadScripts,
      varName,
    },
    'background'
  );

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
      await Promise.allSettled(
        Object.keys(result.variables).map(async (varName) => {
          await this.setVariable(varName, result.variables[varName]);
        })
      );
    }

    let insert = true;
    let replaceTable = false;
    if (isObject(result.columns.insert)) {
      const {
        insert: insertData,
        nextBlockId: inputNextBlockId,
        replaceTable: replaceTableParam,
      } = result.columns.insert;

      replaceTable = Boolean(replaceTableParam);
      insert = typeof insertData === 'boolean' ? insertData : true;

      if (inputNextBlockId) {
        let customNextBlockId = this.getBlockConnections(inputNextBlockId);

        const nextBlock = this.engine.blocks[inputNextBlockId];
        if (!customNextBlockId && nextBlock) {
          customNextBlockId = [
            {
              id: inputNextBlockId,
              blockId: inputNextBlockId,
              connections: new Map([]),
            },
          ];
        }

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

        if (replaceTable) {
          this.engine.referenceData.table = [];
          Object.keys(this.engine.columns).forEach((key) => {
            this.engine.columns[key].index = 0;
          });
        }

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

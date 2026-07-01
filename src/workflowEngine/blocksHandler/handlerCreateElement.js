import { MessageListener } from '@/utils/message';
import { customAlphabet } from 'nanoid/non-secure';
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

function createElementScript(code, blockId, $automaScript, $preloadScripts) {
  // fixme: 这里是有问题的，如果按现在方案会至少创建两个script标签，
  // 一个是preloadScripts，一个是automaScript
  // 那么在现在的方案中 VM 可能导致不共享 window 变量
  const str = `
    const baseId = 'automa-${blockId}';

    ${JSON.stringify($preloadScripts)}.forEach((item) => {
      if (item.type === 'style') return;

      const script = document.createElement(item.type);
      script.id = \`\${baseId}-script\`;
      script.textContent = item.script;

      document.body.appendChild(script);
    });

    const script = document.createElement('script');
    script.id = \`\${baseId}-javascript\`;
    script.textContent = \`(() => { ${$automaScript}\n${code} })()\`;

    document.body.appendChild(script);
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

  // (data.javascript || data.preloadScripts.length > 0) &&
  const isMV3 = !this.engine.isMV2;
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

    const { debugMode = false } = this.engine.workflow?.settings || {};

    // 创建一个简单的回调函数，直接返回要执行的代码
    const callbackFunction = `
      function() {
        // 创建一个包含所有预加载脚本的代码块
        const preloadScripts = ${JSON.stringify(preloadScripts)};
        const blockId = "${block.id}";
        const automaScript = ${JSON.stringify(
          payload.data?.automaScript || ''
        )};
        const javascript = ${JSON.stringify(data.javascript || '')};

        // 返回一个完整的、可执行的JavaScript代码字符串
        return \`
          // 执行预加载脚本
          \${preloadScripts.map(item => {
            if (item.type === 'style') return '';
            return \`try { eval(\${JSON.stringify(item.script)}); } catch(e) { console.error('预加载脚本执行错误:', e); }\`;
          }).join('\\n')}

          // 执行主要JavaScript代码
          try {
            (function() {
              \${automaScript}
              \${javascript}
            })();
          } catch(error) {
            console.error('执行JavaScript代码时出错:', error);
          }

          // 返回一个值，确保不是undefined
          true;
        \`;
      }
    `;

    // 使用checkCSPAndInject函数处理CSP限制
    const result = await checkCSPAndInject(
      {
        target,
        debugMode,
        options: {
          awaitPromise: false,
          returnByValue: true, // 确保返回值是JavaScript代码字符串
        },
      },
      callbackFunction
    );

    if (!result.isBlocked) {
      const jsCode = createElementScript(
        data.javascript,
        block.id,
        payload.data?.automaScript || '',
        preloadScripts || []
      );
      await MessageListener.sendMessage(
        'script:execute-callback',
        {
          target,
          callback: jsCode,
        },
        'background'
      );
    } else {
      console.log('CreateElement: 使用CSP绕过方法执行代码');
    }
  }

  return {
    data: '',
    nextBlockId: this.getBlockConnections(block.id),
  };
}

export default handleCreateElement;

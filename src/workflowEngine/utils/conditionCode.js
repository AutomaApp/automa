import { customAlphabet } from 'nanoid/non-secure';
import { automaRefDataStr, checkCSPAndInject, messageSandbox } from '../helper';

const nanoid = customAlphabet('1234567890abcdef', 5);

export default async function (activeTab, payload) {
  const variableId = `automa${nanoid()}`;

  if (
    !payload.data.context ||
    payload.data.context === 'website' ||
    !payload.isPopup
  ) {
    if (!activeTab.id) throw new Error('no-tab');

    const refDataScriptStr = automaRefDataStr(variableId);

    // 构建一个完全自包含的函数字符串，其中所有变量都是硬编码的
    // 这确保在跨环境执行时不依赖闭包变量
    const callbackFunctionStr = `
      function() {
        // 直接返回一个自执行的异步函数字符串
        // 所有变量值都已内联到字符串中
        return \`
        (async () => {
          const automa${variableId} = ${JSON.stringify(payload.refData)};
          ${refDataScriptStr}
          try {
            ${payload.data.code}
          } catch (error) {
            return {
              $isError: true,
              message: error.message,
            }
          }
        })();
        \`;
      }
      `;

    const result = await checkCSPAndInject(
      {
        target: { tabId: activeTab.id },
        debugMode: payload.debugMode,
      },
      callbackFunctionStr
    );

    return result.value;
  }

  const result = await messageSandbox('conditionCode', payload);
  if (result && result.$isError) throw new Error(result.message);

  return result;
}

import { nanoid } from 'nanoid/non-secure';

export default function (data) {
  let timeout;
  const instanceId = nanoid();
  const scriptId = `script${data.id}`;
  const propertyName = `automa${data.id}`;

  const isScriptExists = document.querySelector(`#${scriptId}`);
  if (isScriptExists) {
    window.top.postMessage(
      {
        id: data.id,
        type: 'sandbox',
        result: {
          columns: {},
          variables: {},
        },
      },
      '*'
    );

    return;
  }

  const preloadScripts = data.preloadScripts.map((item) => {
    const scriptEl = document.createElement('script');
    scriptEl.textContent = item.script;

    (document.body || document.documentElement).appendChild(scriptEl);

    return scriptEl;
  });

  if (!data.blockData.code.includes('automaNextBlock')) {
    data.blockData.code += `\n automaNextBlock()`;
  }

  const script = document.createElement('script');
  script.id = scriptId;
  script.textContent = `
    (() => {
      function automaRefData(keyword, path = '') {
        return window.$getNestedProperties(${propertyName}.refData, keyword + '.' + path);
      }
      function automaSetVariable(name, value) {
        const variables = ${propertyName}.refData.variables;
        if (!variables) ${propertyName}.refData.variables = {}

        ${propertyName}.refData.variables[name] = value;
      }
      function automaNextBlock(data = {}, insert = true) {
        ${propertyName}.nextBlock({ data, insert });
      }
      function automaResetTimeout() {
        ${propertyName}.resetTimeout();
      }
      function automaFetch(type, resource) {
        return ${propertyName}.fetch(type, resource);
      }

      try {
        ${data.blockData.code}
      } catch (error) {
        console.error(error);
        automaNextBlock({ $error: true, message: error.message });
      }
    })();
  `;

  function cleanUp() {
    script.remove();
    preloadScripts.forEach((preloadScript) => {
      preloadScript.remove();
    });

    delete window[propertyName];
  }

  window[propertyName] = {
    refData: data.refData,
    nextBlock: (result) => {
      cleanUp();
      window.top.postMessage(
        {
          id: data.id,
          type: 'sandbox',
          result: {
            variables: data?.refData?.variables,
            columns: {
              data: result?.data,
              insert: result?.insert,
            },
          },
        },
        '*'
      );
    },
    resetTimeout: () => {
      clearTimeout(timeout);
      timeout = setTimeout(cleanUp, data.blockData.timeout);
    },
    fetch: (type, resource) => {
      return new Promise((resolve, reject) => {
        const types = ['json', 'text'];
        if (!type || !types.includes(type)) {
          reject(new Error('The "type" must be "text" or "json"'));
          return;
        }

        window.top.postMessage(
          {
            type: 'automa-fetch',
            data: { id: instanceId, type, resource },
          },
          '*'
        );

        const eventName = `automa-fetch-response-${instanceId}`;

        const eventListener = ({ detail }) => {
          window.removeEventListener(eventName, eventListener);

          if (detail.isError) {
            reject(new Error(detail.result));
          } else {
            resolve(detail.result);
          }
        };

        window.addEventListener(eventName, eventListener);
      });
    },
  };

  timeout = setTimeout(cleanUp, data.blockData.timeout);
  (document.body || document.documentElement).appendChild(script);
}

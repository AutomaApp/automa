import objectPath from 'object-path';

window.$getNestedProperties = objectPath.get;

function handleJavascriptBlock(data) {
  let timeout;
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

    document.body.appendChild(scriptEl);

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
        ${propertyName}.refData.variables[name] = value;
      }
      function automaNextBlock(data = {}, insert = true) {
        ${propertyName}.nextBlock({ data, insert });
      }
      function automaResetTimeout() {
        ${propertyName}.resetTimeout();
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
  };

  timeout = setTimeout(cleanUp, data.blockData.timeout);
  document.body.appendChild(script);
}
function handleConditionCode(data) {
  const propertyName = `automa${data.id}`;

  const script = document.createElement('script');
  script.textContent = `
    (async () => {
      function automaRefData(keyword, path = '') {
        return window.$getNestedProperties(${propertyName}.refData, keyword + '.' + path);
      }

      try {
        ${data.data.code}
      } catch (error) {
        return {
          $isError: true,
          message: error.message,
        }
      }
    })()
      .then((result) => {
        ${propertyName}.done(result);
      });
  `;

  window[propertyName] = {
    refData: data.refData,
    done: (result) => {
      script.remove();
      delete window[propertyName];

      window.top.postMessage(
        {
          result,
          id: data.id,
          type: 'sandbox',
        },
        '*'
      );
    },
  };

  document.body.appendChild(script);
}

const eventHandlers = {
  conditionCode: handleConditionCode,
  javascriptBlock: handleJavascriptBlock,
};

function onMessage({ data }) {
  if (!data.id || !data.type || !eventHandlers[data.type]) return;

  eventHandlers[data.type](data);
}

window.addEventListener('message', onMessage);

export default function (data) {
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

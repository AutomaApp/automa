export default function (data) {
  const propertyName = `automa${data.id}`;

  const script = document.createElement('script');
  script.textContent = `
    (async () => {
      function automaRefData(keyword, path = '') {
        if (!keyword) return null;
        if (!path) return ${propertyName}.refData[keyword];

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

  (document.body || document.documentElement).appendChild(script);
}

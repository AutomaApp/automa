import { sendMessage } from '@/utils/message';

function getAutomaScript(blockId) {
  return `
function automaNextBlock(data) {
  window.dispatchEvent(new CustomEvent('__automa-next-block__', { detail: data }));
}
function automaResetTimeout() {
 window.dispatchEvent(new CustomEvent('__automa-reset-timeout__'));
}
function findData(obj, path) {
  const paths = path.split('.');
  const isWhitespace = paths.length === 1 && !/\\S/.test(paths[0]);

  if (paths.length === 0 || isWhitespace) return obj;

  let current = obj;

  for (let i = 0; i < paths.length; i++) {
    if (current[paths[i]] == undefined) {
      return undefined;
    } else {
      current = current[paths[i]];
    }
  }

  return current;
}
function automaRefData(keyword, path = '') {
  const data = JSON.parse(sessionStorage.getItem('automa--${blockId}')) || null;

  if (data === null) return null;

  return findData(data[keyword], path);
}
  `;
}

function javascriptCode(block) {
  sessionStorage.setItem(`automa--${block.id}`, JSON.stringify(block.refData));
  const automaScript = getAutomaScript(block.id);

  return new Promise((resolve) => {
    const isScriptExists = document.getElementById('automa-custom-js');
    const scriptAttr = `block--${block.id}`;

    if (isScriptExists && isScriptExists.hasAttribute(scriptAttr)) {
      resolve('');
      return;
    }

    const promisePreloadScripts =
      block.data?.preloadScripts.map(async (item) => {
        try {
          const { protocol, pathname } = new URL(item.src);
          const isValidUrl = /https?/.test(protocol) && /\.js$/.test(pathname);

          if (!isValidUrl) return null;

          const script = await sendMessage(
            'fetch:text',
            item.src,
            'background'
          );
          const scriptEl = document.createElement('script');

          scriptEl.type = 'text/javascript';
          scriptEl.innerHTML = script;

          return {
            ...item,
            script: scriptEl,
          };
        } catch (error) {
          return null;
        }
      }, []) || [];

    Promise.allSettled(promisePreloadScripts).then((result) => {
      const preloadScripts = result.reduce((acc, { status, value }) => {
        if (status !== 'fulfilled' || !value) return acc;

        acc.push(value);
        document.body.appendChild(value.script);

        return acc;
      }, []);

      const script = document.createElement('script');
      let timeout;

      script.setAttribute(scriptAttr, '');
      script.id = 'automa-custom-js';
      script.innerHTML = `(() => {\n${automaScript} ${block.data.code}\n})()`;

      const cleanUp = (data = '') => {
        script.remove();
        preloadScripts.forEach((item) => {
          if (item.removeAfterExec) item.script.remove();
        });
        sessionStorage.removeItem(`automa--${block.id}`);
        resolve(data);
      };

      window.addEventListener('__automa-next-block__', ({ detail }) => {
        clearTimeout(timeout);
        cleanUp(detail || {});
      });
      window.addEventListener('__automa-reset-timeout__', () => {
        clearTimeout(timeout);

        timeout = setTimeout(cleanUp, block.data.timeout);
      });

      document.body.appendChild(script);

      timeout = setTimeout(cleanUp, block.data.timeout);
    });
  });
}

export default javascriptCode;

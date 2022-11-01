import { jsContentHandler } from '@/workflowEngine/utils/javascriptBlockUtil';

function javascriptCode({ data, isPreloadScripts, frameSelector }) {
  if (!isPreloadScripts) return jsContentHandler(...data);

  let $documentCtx = document;

  if (frameSelector) {
    const iframeCtx = document.querySelector(frameSelector)?.contentDocument;
    if (!iframeCtx) return Promise.resolve(false);

    $documentCtx = iframeCtx;
  }

  data.scripts.forEach((script) => {
    const scriptAttr = `block--${script.id}`;

    const isScriptExists = $documentCtx.querySelector(
      `.automa-custom-js[${scriptAttr}]`
    );

    if (isScriptExists) return;

    const scriptEl = $documentCtx.createElement('script');
    scriptEl.textContent = script.data.code;
    scriptEl.setAttribute(scriptAttr, '');
    scriptEl.classList.add('automa-custom-js');

    $documentCtx.documentElement.appendChild(scriptEl);
  });

  return Promise.resolve(true);
}

export default javascriptCode;

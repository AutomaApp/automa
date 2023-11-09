import { jsContentHandler } from '@/workflowEngine/utils/javascriptBlockUtil';
import { getDocumentCtx } from '../handleSelector';

function javascriptCode({ data, isPreloadScripts, frameSelector }) {
  if (!isPreloadScripts && Array.isArray(data))
    return jsContentHandler(...data);
  if (!data.scripts) return Promise.resolve({ success: true });

  let $documentCtx = document;

  if (frameSelector) {
    const iframeCtx = getDocumentCtx(frameSelector);
    if (!iframeCtx) return Promise.resolve({ success: false });

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

  return Promise.resolve({ success: true });
}

export default javascriptCode;

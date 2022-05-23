import browser from 'webextension-polyfill';
import initElementSelector from './main';
import initRecordEvents from './recordEvents';
import selectorFrameContext from '../../elementSelector/selectorFrameContext';

(async () => {
  try {
    const isMainFrame = window.self === window.top;

    if (isMainFrame) {
      const element = document.querySelector('#automa-recording');
      if (element) return;

      const destroyRecordEvents = await initRecordEvents();
      const elementSelectorInstance = await initElementSelector();

      browser.runtime.onMessage.addListener(function messageListener({ type }) {
        if (type === 'recording:stop') {
          destroyRecordEvents();
          elementSelectorInstance.unmount();
          browser.runtime.onMessage.removeListener(messageListener);
        }
      });
    } else {
      const style = document.createElement('style');
      style.textContent = '[automa-el-list] {outline: 2px dashed #6366f1;}';

      document.body.appendChild(style);

      selectorFrameContext();
    }
  } catch (error) {
    console.error(error);
  }
})();

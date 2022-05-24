import browser from 'webextension-polyfill';
import initElementSelector from './main';
import initRecordEvents from './recordEvents';
import selectorFrameContext from '../../elementSelector/selectorFrameContext';

(async () => {
  try {
    let elementSelectorInstance = null;
    const isMainFrame = window.self === window.top;
    const destroyRecordEvents = await initRecordEvents(isMainFrame);

    if (isMainFrame) {
      const element = document.querySelector('#automa-recording');
      if (element) return;

      elementSelectorInstance = await initElementSelector();
    } else {
      const style = document.createElement('style');
      style.textContent = '[automa-el-list] {outline: 2px dashed #6366f1;}';

      document.body.appendChild(style);

      selectorFrameContext();
    }

    browser.runtime.onMessage.addListener(function messageListener({ type }) {
      if (type === 'recording:stop') {
        if (elementSelectorInstance) {
          elementSelectorInstance.unmount();
        }

        destroyRecordEvents();
        browser.runtime.onMessage.removeListener(messageListener);
      }
    });
  } catch (error) {
    console.error(error);
  }
})();

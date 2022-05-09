import browser from 'webextension-polyfill';
import initElementSelector from './main';
import initRecordEvents from './recordEvents';

(async () => {
  try {
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
  } catch (error) {
    console.error(error);
  }
})();

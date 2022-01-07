import browser from 'webextension-polyfill';
import webService from './web-service';
import shortcutListener from './shortcut-listener';

(async () => {
  try {
    const { workflows } = await browser.storage.local.get('workflows');

    await webService(workflows);
    await shortcutListener(workflows);
  } catch (error) {
    console.error(error);
  }
})();

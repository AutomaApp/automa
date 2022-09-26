import browser from 'webextension-polyfill';

class BackgroundUtils {
  static async openDashboard(url) {
    const tabUrl = browser.runtime.getURL(
      `/newtab.html#${typeof url === 'string' ? url : ''}`
    );

    try {
      const [tab] = await browser.tabs.query({
        url: browser.runtime.getURL('/newtab.html'),
      });

      if (tab) {
        await browser.tabs.update(tab.id, { url: tabUrl, active: true });
        await browser.windows.update(tab.windowId, {
          focused: true,
          state: 'maximized',
        });

        if (tabUrl.includes('workflows/')) {
          await browser.tabs.reload(tab.id);
        }
      } else {
        browser.windows.create({
          url: tabUrl,
          focused: true,
          type: 'popup',
          state: 'maximized',
        });
      }
    } catch (error) {
      console.error(error);
    }
  }
}

export default BackgroundUtils;

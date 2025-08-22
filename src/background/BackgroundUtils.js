import { waitTabLoaded } from '@/workflowEngine/helper';
import browser from 'webextension-polyfill';

class BackgroundUtils {
  static async openDashboard(url, updateTab = true) {
    const tabUrl = browser.runtime.getURL(
      `/src/newtab/index.html#${typeof url === 'string' ? url : ''}`
    );

    try {
      const [tab] = await browser.tabs.query({
        url: browser.runtime.getURL('/src/newtab/index.html'),
      });

      if (tab) {
        const tabOptions = { active: true };
        if (updateTab) tabOptions.url = tabUrl;

        await browser.tabs.update(tab.id, tabOptions);

        if (updateTab) {
          await browser.windows.update(tab.windowId, {
            focused: true,
            state: 'maximized',
          });
        }
      } else {
        const curWin = await browser.windows.getCurrent();
        const windowOptions = {
          top: 0,
          left: 0,
          width: Math.min(curWin.width, 715),
          height: Math.min(curWin.height, 715),
          url: tabUrl,
          type: 'popup',
        };

        if (updateTab) {
          windowOptions.focused = true;
        }

        await browser.windows.create(windowOptions);
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async sendMessageToDashboard(type, data) {
    const [tab] = await browser.tabs.query({
      url: browser.runtime.getURL('/src/newtab/index.html'),
    });

    await waitTabLoaded({ tabId: tab.id });
    const result = await browser.tabs.sendMessage(tab.id, { type, data });

    return result;
  }
}

export default BackgroundUtils;

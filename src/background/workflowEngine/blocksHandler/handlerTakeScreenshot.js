import browser from 'webextension-polyfill';
import { fileSaver } from '@/utils/helper';
import { getBlockConnection, waitTabLoaded } from '../helper';

async function saveImage({ filename, uri, ext }) {
  const hasDownloadAccess = await browser.permissions.contains({
    permissions: ['downloads'],
  });
  const name = `${filename || 'Screenshot'}.${ext || 'png'}`;

  if (hasDownloadAccess) {
    await browser.downloads.download({
      url: uri,
      filename: name,
    });

    return;
  }

  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);

    fileSaver(name, canvas.toDataURL());
  };

  image.src = uri;
}

async function takeScreenshot({ data, outputs, name }) {
  const nextBlockId = getBlockConnection({ outputs });
  const saveToComputer =
    typeof data.saveToComputer === 'undefined' || data.saveToComputer;

  try {
    let screenshot = null;
    const options = {
      quality: data.quality,
      format: data.ext || 'png',
    };
    const saveScreenshot = async (dataUrl) => {
      if (data.saveToColumn) this.addDataToColumn(data.dataColumn, dataUrl);
      if (saveToComputer)
        await saveImage({
          filename: data.fileName,
          uri: dataUrl,
          ext: data.ext,
        });
      if (data.assignVariable) this.setVariable(data.variableName, dataUrl);
    };

    if (data.captureActiveTab) {
      if (!this.activeTab.id) {
        throw new Error('no-tab');
      }

      let tab = null;
      const isChrome = BROWSER_TYPE === 'chrome';
      const captureTab = () => {
        if (isChrome) return browser.tabs.captureVisibleTab(options);

        return browser.tabs.captureTab(this.activeTab.id, options);
      };

      if (isChrome) {
        [tab] = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (this.windowId) {
          await browser.windows.update(this.windowId, { focused: true });
        }
      }

      await browser.tabs.update(this.activeTab.id, { active: true });
      await waitTabLoaded(this.activeTab.id);

      screenshot = await (data.fullPage ||
      ['element', 'fullpage'].includes(data.type)
        ? this._sendMessageToTab({
            name,
            options,
            data: {
              type: data.type,
              selector: data.selector,
            },
            tabId: this.activeTab.id,
          })
        : captureTab());

      if (tab) {
        await browser.windows.update(tab.windowId, { focused: true });
        await browser.tabs.update(tab.id, { active: true });
      }

      await saveScreenshot(screenshot);
    } else {
      screenshot = await browser.tabs.captureVisibleTab(options);

      await saveScreenshot(screenshot);
    }

    return { data: screenshot, nextBlockId };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    if (data.type === 'element') error.data = { selector: data.selector };

    throw error;
  }
}

export default takeScreenshot;

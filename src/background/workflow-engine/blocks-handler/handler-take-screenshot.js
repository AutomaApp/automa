import browser from 'webextension-polyfill';
import { fileSaver } from '@/utils/helper';
import { getBlockConnection } from '../helper';

function saveImage({ fileName, uri, ext }) {
  const image = new Image();

  image.onload = () => {
    const name = `${fileName || 'Screenshot'}.${ext || 'png'}`;
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
    const saveScreenshot = (dataUrl) => {
      if (data.saveToColumn) this.addDataToColumn(data.dataColumn, dataUrl);
      if (saveToComputer)
        saveImage({ fileName: data.fileName, uri: dataUrl, ext: data.ext });
      if (data.assignVariable) this.setVariable(data.variableName, dataUrl);
    };

    if (data.captureActiveTab) {
      if (!this.activeTab.id) {
        throw new Error('no-tab');
      }

      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (this.windowId)
        await browser.windows.update(this.windowId, { focused: true });
      await browser.tabs.update(this.activeTab.id, { active: true });

      await new Promise((resolve) => setTimeout(resolve, 500));

      screenshot = await (data.fullPage
        ? this._sendMessageToTab({
            name,
            options,
            tabId: this.activeTab.id,
          })
        : browser.tabs.captureVisibleTab(options));

      if (tab) {
        await browser.windows.update(tab.windowId, { focused: true });
        await browser.tabs.update(tab.id, { active: true });
      }

      saveScreenshot(screenshot);
    } else {
      screenshot = await browser.tabs.captureVisibleTab(options);

      saveScreenshot(screenshot);
    }

    return { data: screenshot, nextBlockId };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

export default takeScreenshot;

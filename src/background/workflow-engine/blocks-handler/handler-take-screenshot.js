import browser from 'webextension-polyfill';
import { getBlockConnection } from '../helper';
import { fileSaver } from '@/utils/helper';

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

async function takeScreenshot(block) {
  const nextBlockId = getBlockConnection(block);
  const {
    ext,
    quality,
    captureActiveTab,
    fileName,
    saveToColumn,
    dataColumn,
    fullPage,
  } = block.data;

  const saveToComputer =
    typeof block.data.saveToComputer === 'undefined'
      ? true
      : block.data.saveToComputer;

  try {
    const options = {
      quality,
      format: ext || 'png',
    };

    if (captureActiveTab) {
      if (!this.activeTab.id) {
        throw new Error('no-tab');
      }

      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      await browser.windows.update(this.windowId, { focused: true });
      await browser.tabs.update(this.activeTab.id, { active: true });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const uri = await (fullPage
        ? this._sendMessageToTab({
            tabId: this.activeTab.id,
            options,
            name: block.name,
          })
        : browser.tabs.captureVisibleTab(options));

      if (tab) {
        await browser.windows.update(tab.windowId, { focused: true });
        await browser.tabs.update(tab.id, { active: true });
      }

      if (saveToColumn) this.addDataToColumn(dataColumn, uri);
      if (saveToComputer) saveImage({ fileName, uri, ext });
    } else {
      const uri = await browser.tabs.captureVisibleTab(options);

      if (saveToColumn) this.addDataToColumn(dataColumn, uri);
      if (saveToComputer) saveImage({ fileName, uri, ext });
    }

    return { data: '', nextBlockId };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

export default takeScreenshot;

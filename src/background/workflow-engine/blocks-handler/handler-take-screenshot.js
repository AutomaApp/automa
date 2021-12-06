import browser from 'webextension-polyfill';
import { getBlockConnection } from '../helper';
import { fileSaver } from '@/utils/helper';

function saveImage(filename, fileName, uri) {
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
  const { ext, quality, captureActiveTab, fileName } = block.data;

  try {
    const options = {
      quality,
      format: ext || 'png',
    };

    if (captureActiveTab) {
      if (!this.tabId) {
        throw new Error('no-tab');
      }

      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      await browser.windows.update(this.windowId, { focused: true });
      await browser.tabs.update(this.tabId, { active: true });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const uri = await browser.tabs.captureVisibleTab(options);

      if (tab) {
        await browser.windows.update(tab.windowId, { focused: true });
        await browser.tabs.update(tab.id, { active: true });
      }

      saveImage(fileName, uri);
    } else {
      const uri = await browser.tabs.captureVisibleTab(options);

      saveImage(fileName, uri);
    }

    return { data: '', nextBlockId };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

export default takeScreenshot;

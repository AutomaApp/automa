import { fileSaver } from '@/utils/helper';
import BrowserAPIService from '@/service/browser-api/BrowserAPIService';
import { IS_FIREFOX } from '@/common/utils/constant';
import { waitTabLoaded } from '../helper';

async function saveImage({ filename, uri, ext }) {
  const hasDownloadAccess = await BrowserAPIService.permissions.contains({
    permissions: ['downloads'],
  });
  const name = `${filename || 'Screenshot'}.${ext || 'png'}`;

  if (hasDownloadAccess) {
    await BrowserAPIService.downloads.download({
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

async function takeScreenshot({ data, id, label }) {
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
      if (data.assignVariable)
        await this.setVariable(data.variableName, dataUrl);
    };

    if (data.captureActiveTab) {
      if (!this.activeTab.id) {
        throw new Error('no-tab');
      }

      let tab = null;
      const isChrome = !IS_FIREFOX;
      const captureTab = async () => {
        let result = null;

        if (isChrome) {
          const currentTab = await BrowserAPIService.tabs.get(
            this.activeTab.id
          );
          result = await BrowserAPIService.tabs.captureVisibleTab(
            currentTab.windowId,
            options
          );
        } else {
          result = await BrowserAPIService.tabs.captureTab(
            this.activeTab.id,
            options
          );
        }

        return result;
      };

      if (isChrome) {
        [tab] = await BrowserAPIService.tabs.query({
          active: true,
          url: '*://*/*',
        });

        if (this.windowId) {
          await BrowserAPIService.windows.update(this.windowId, {
            focused: true,
          });
        }
      }

      await BrowserAPIService.tabs.update(this.activeTab.id, { active: true });
      await waitTabLoaded({ tabId: this.activeTab.id, listenError: true });

      screenshot = await (data.fullPage ||
      ['element', 'fullpage'].includes(data.type)
        ? this._sendMessageToTab({
            label,
            options,
            data: {
              type: data.type,
              selector: data.selector,
            },
            tabId: this.activeTab.id,
          })
        : captureTab());

      if (tab) {
        await BrowserAPIService.windows.update(tab.windowId, { focused: true });
        await BrowserAPIService.tabs.update(tab.id, { active: true });
      }

      await saveScreenshot(screenshot);
    } else {
      screenshot = await BrowserAPIService.tabs.captureVisibleTab(options);

      await saveScreenshot(screenshot);
    }

    return {
      data: screenshot,
      nextBlockId: this.getBlockConnections(id),
    };
  } catch (error) {
    if (data.type === 'element') error.data = { selector: data.selector };

    throw error;
  }
}

export default takeScreenshot;

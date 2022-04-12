import browser from 'webextension-polyfill';
import { getBlockConnection } from '../helper';

function getFilename(url) {
  try {
    const filename = new URL(url).pathname.split('/').pop();
    const hasExtension = /\.[0-9a-z]+$/i.test(filename);

    if (!hasExtension) return null;

    return filename;
  } catch (e) {
    return null;
  }
}

export default async function ({ data, id, name, outputs }) {
  const nextBlockId = getBlockConnection({ outputs });

  try {
    const hasPermission = await browser.permissions.contains({
      permissions: ['downloads'],
    });

    if (!hasPermission) {
      throw new Error('no-permission');
    }

    let sources = [data.url];
    let index = 0;
    const downloadFile = (url) => {
      const options = { url, conflictAction: data.onConflict };
      let filename = data.filename || getFilename(url);

      if (filename) {
        if (data.onConflict === 'overwrite' && index !== 0) {
          filename = `(${index}) ${filename}`;
        }

        options.filename = filename;
        index += 1;
      }

      return browser.downloads.download(options);
    };

    if (data.type === 'element') {
      sources = await this._sendMessageToTab({
        id,
        name,
        data,
        tabId: this.activeTab.id,
      });

      await Promise.all(sources.map((url) => downloadFile(url)));
    } else if (data.type === 'url') {
      await downloadFile(data.url);
    }

    return {
      nextBlockId,
      data: sources,
    };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

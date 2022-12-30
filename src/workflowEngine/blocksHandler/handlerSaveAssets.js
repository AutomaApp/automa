import browser from 'webextension-polyfill';

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

export default async function ({ data, id, label }) {
  const hasPermission = await browser.permissions.contains({
    permissions: ['downloads'],
  });

  if (!hasPermission) {
    const error = new Error('no-permission');
    error.data = { permission: 'downloads' };

    throw error;
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

  let downloadIds = null;

  if (data.type === 'element') {
    sources = await this._sendMessageToTab({
      id,
      data,
      label,
      tabId: this.activeTab.id,
    });

    downloadIds = await Promise.all(sources.map((url) => downloadFile(url)));
  } else if (data.type === 'url') {
    downloadIds = [await downloadFile(data.url)];
  }

  if (data.saveDownloadIds) {
    if (data.assignVariable) {
      this.setVariable(data.variableName, downloadIds);
    }
    if (data.saveData) {
      this.addDataToColumn(data.dataColumn, downloadIds);
    }
  }

  return {
    data: { sources, downloadIds },
    nextBlockId: this.getBlockConnections(id),
  };
}

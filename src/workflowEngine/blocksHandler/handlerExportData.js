import browser from 'webextension-polyfill';
import { default as dataExporter, files } from '@/utils/dataExporter';

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

async function exportData({ data, id }, { refData }) {
  const dataToExport = data.dataToExport || 'data-columns';
  let payload = refData.table;

  if (dataToExport === 'google-sheets') {
    payload = refData.googleSheets[data.refKey] || [];
  } else if (dataToExport === 'variable') {
    payload = refData.variables[data.variableName] || [];

    if (!Array.isArray(payload)) {
      payload = [payload];

      if (data.type === 'csv' && typeof payload[0] !== 'object')
        payload = [payload];
    }
  }

  const hasDownloadAccess = await browser.permissions.contains({
    permissions: ['downloads'],
  });
  let blobUrl = dataExporter(payload, {
    ...data,
    csvOptions: {
      delimiter: data.csvDelimiter || ',',
    },
    returnUrl: hasDownloadAccess,
    returnBlob: !this.engine.isPopup && !this.engine.isMV2,
  });

  if (!this.engine.isPopup && !hasDownloadAccess) {
    throw new Error("Don't have download permission");
  } else if (!this.engine.isPopup && !this.engine.isMV2) {
    blobUrl = await blobToBase64(blobUrl);
  }

  if (hasDownloadAccess) {
    const filename = `${data.name || 'unnamed'}${files[data.type].ext}`;
    const options = {
      filename,
      conflictAction: data.onConflict || 'uniquify',
    };

    await browser.downloads.download({
      ...options,
      url: blobUrl,
    });
  }

  return {
    data: '',
    nextBlockId: this.getBlockConnections(id),
  };
}

export default exportData;

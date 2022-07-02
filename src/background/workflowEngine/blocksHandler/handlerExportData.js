import browser from 'webextension-polyfill';
import { default as dataExporter, files } from '@/utils/dataExporter';

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
  const blobUrl = dataExporter(payload, {
    ...data,
    csvOptions: {
      delimiter: data.csvDelimiter || ',',
    },
    returnUrl: hasDownloadAccess,
  });

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

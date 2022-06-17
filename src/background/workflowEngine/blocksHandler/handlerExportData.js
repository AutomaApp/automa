import browser from 'webextension-polyfill';
import { default as dataExporter, files } from '@/utils/dataExporter';
import { getBlockConnection } from '../helper';

async function exportData({ data, outputs }, { refData }) {
  const nextBlockId = getBlockConnection({ outputs });

  try {
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
      nextBlockId,
    };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

export default exportData;

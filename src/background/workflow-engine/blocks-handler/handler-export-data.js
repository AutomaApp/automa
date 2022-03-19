import browser from 'webextension-polyfill';
import { getBlockConnection } from '../helper';
import { default as dataExporter, files } from '@/utils/data-exporter';

async function exportData({ data, outputs }) {
  const nextBlockId = getBlockConnection({ outputs });

  try {
    const dataToExport = data.dataToExport || 'data-columns';
    let payload = this.referenceData.table;

    if (dataToExport === 'google-sheets') {
      payload = this.referenceData.googleSheets[data.refKey] || [];
    }

    const hasDownloadAccess = await browser.permissions.contains({
      permissions: ['downloads'],
    });
    const blobUrl = dataExporter(payload, {
      ...data,
      returnUrl: hasDownloadAccess,
    });

    if (hasDownloadAccess) {
      const filename = `${data.name}${files[data.type].ext}`;
      const blobId = blobUrl.replace('blob:chrome-extension://', '');
      const filesname =
        JSON.parse(sessionStorage.getItem('export-filesname')) || {};

      const options = {
        filename,
        conflictAction: data.onConflict || 'uniquify',
      };

      filesname[blobId] = options;
      sessionStorage.setItem('export-filesname', JSON.stringify(filesname));

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

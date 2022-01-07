import { getBlockConnection } from '../helper';
import dataExporter from '@/utils/data-exporter';

function exportData({ data, outputs }) {
  return new Promise((resolve) => {
    const dataToExport = data.dataToExport || 'data-columns';
    let payload = this.referenceData.dataColumns;

    if (dataToExport === 'google-sheets') {
      payload = this.referenceData.googleSheets[data.refKey] || [];
    }

    dataExporter(payload, data);

    resolve({
      data: '',
      nextBlockId: getBlockConnection({ outputs }),
    });
  });
}

export default exportData;

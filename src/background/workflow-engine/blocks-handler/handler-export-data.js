import { getBlockConnection } from '../helper';
import dataExporter from '@/utils/data-exporter';

function exportData(block) {
  return new Promise((resolve) => {
    dataExporter(this.data, block.data);

    resolve({
      data: '',
      nextBlockId: getBlockConnection(block),
    });
  });
}

export default exportData;

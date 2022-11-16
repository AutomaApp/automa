import Papa from 'papaparse';
import { parseJSON } from '@/utils/helper';
import getFile, { readFileAsBase64 } from '@/utils/getFile';
import renderString from '../templating/renderString';

async function insertData({ id, data }, { refData }) {
  const replacedValueList = {};

  for (const item of data.dataList) {
    let value = '';

    if (item.isFile) {
      const replacedPath = await renderString(
        item.filePath || '',
        refData,
        this.engine.isPopup
      );
      const path = replacedPath.value;
      const isJSON = path.endsWith('.json');
      const isCSV = path.endsWith('.csv');

      let action = item.action || item.csvAction || 'default';
      if (action === 'text' && !isCSV) action = 'default';

      let responseType = isJSON ? 'json' : 'text';
      if (action === 'base64') responseType = 'blob';

      let result = await getFile(path, {
        responseType,
        returnValue: true,
      });

      if (result && isCSV && action && action.includes('json')) {
        const parsedCSV = Papa.parse(result, {
          header: action.includes('header'),
        });
        result = parsedCSV.data || [];
      } else if (action === 'base64') {
        result = await readFileAsBase64(result);
      }

      value = result;
      Object.assign(replacedValueList, replacedPath.list);
    } else {
      const replacedValue = await renderString(
        item.value,
        refData,
        this.engine.isPopup
      );
      value = parseJSON(replacedValue.value, replacedValue.value);
      Object.assign(replacedValueList, replacedValue.list);
    }

    if (item.type === 'table') {
      this.addDataToColumn(item.name, value);
    } else {
      this.setVariable(item.name, value);
    }
  }

  return {
    data: '',
    replacedValue: replacedValueList,
    nextBlockId: this.getBlockConnections(id),
  };
}

export default insertData;

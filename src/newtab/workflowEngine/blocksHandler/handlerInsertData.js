import Papa from 'papaparse';
import { parseJSON } from '@/utils/helper';
import getFile from '@/utils/getFile';
import renderString from '../templating/renderString';

async function insertData({ id, data }, { refData }) {
  const replacedValueList = {};

  for (const item of data.dataList) {
    let value = '';

    if (item.isFile) {
      const replacedPath = await renderString(item.filePath || '', refData);
      const path = replacedPath.value;
      const isJSON = path.endsWith('.json');
      const isCSV = path.endsWith('.csv');

      let result = await getFile(path, {
        returnValue: true,
        responseType: isJSON ? 'json' : 'text',
      });

      if (
        result &&
        isCSV &&
        item.csvAction &&
        item.csvAction.includes('json')
      ) {
        const parsedCSV = Papa.parse(result, {
          header: item.csvAction.includes('header'),
        });
        result = parsedCSV.data || [];
      }

      value = result;
      Object.assign(replacedValueList, replacedPath.list);
    } else {
      const replacedValue = await renderString(item.value, refData);
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

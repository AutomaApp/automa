import { read as readXlsx, utils as utilsXlsx } from 'xlsx';
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
      const isExcel = /.xlsx?$/.test(path);
      const isJSON = path.endsWith('.json');

      const action = item.action || item.csvAction || 'default';
      let responseType = 'text';

      if (isJSON) responseType = 'json';
      else if (action === 'base64' || (isExcel && action !== 'default'))
        responseType = 'blob';

      let result = await getFile(path, {
        responseType,
        returnValue: true,
      });

      const readAsJson = action.includes('json');

      if (action === 'base64') {
        result = await readFileAsBase64(result);
      } else if (result && path.endsWith('.csv') && readAsJson) {
        const parsedCSV = Papa.parse(result, {
          header: action.includes('header'),
        });
        result = parsedCSV.data || [];
      } else if (isExcel && readAsJson) {
        const base64Xls = await readFileAsBase64(result);
        const wb = readXlsx(base64Xls.slice(base64Xls.indexOf(',')), {
          type: 'base64',
        });

        const inputtedSheet = (item.xlsSheet || '').trim();
        const sheetName = wb.SheetNames.includes(inputtedSheet)
          ? inputtedSheet
          : wb.SheetNames[0];

        const options = {};
        if (item.xlsRange) options.range = item.xlsRange;
        if (!action.includes('header')) options.header = 1;

        const sheetData = utilsXlsx.sheet_to_json(
          wb.Sheets[sheetName],
          options
        );
        result = sheetData;
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
      const values = typeof value === 'string' ? value.split('||') : [value];
      values.forEach((tableValue) => {
        this.addDataToColumn(item.name, tableValue);
      });
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

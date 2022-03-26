import { googleSheets } from '@/utils/api';
import {
  convert2DArrayToArrayObj,
  convertArrObjTo2DArr,
  isWhitespace,
  parseJSON,
} from '@/utils/helper';
import { getBlockConnection } from '../helper';

async function getSpreadsheetValues({ spreadsheetId, range, firstRowAsKey }) {
  const response = await googleSheets.getValues({ spreadsheetId, range });

  if (response.status !== 200) {
    throw new Error(response.statusText);
  }

  const { values } = await response.json();
  const sheetsData = firstRowAsKey ? convert2DArrayToArrayObj(values) : values;

  return sheetsData;
}
async function updateSpreadsheetValues(
  {
    spreadsheetId,
    range,
    valueInputOption,
    keysAsFirstRow,
    dataFrom,
    customData,
  },
  columns
) {
  let values = [];

  if (['data-columns', 'table'].includes(dataFrom)) {
    if (keysAsFirstRow) {
      values = convertArrObjTo2DArr(columns);
    } else {
      values = columns.map(Object.values);
    }
  } else if (dataFrom === 'custom') {
    values = parseJSON(customData, customData);
  }

  const response = await googleSheets.updateValues({
    range,
    spreadsheetId,
    valueInputOption,
    options: {
      body: JSON.stringify({ values }),
    },
  });

  if (response.status !== 200) {
    throw new Error(response.statusText);
  }
}

export default async function ({ data, outputs }) {
  const nextBlockId = getBlockConnection({ outputs });

  try {
    if (isWhitespace(data.spreadsheetId))
      throw new Error('empty-spreadsheet-id');
    if (isWhitespace(data.range)) throw new Error('empty-spreadsheet-range');

    let result = [];

    if (data.type === 'get') {
      const spreadsheetValues = await getSpreadsheetValues(data);

      result = spreadsheetValues;

      if (data.refKey && !isWhitespace(data.refKey)) {
        this.referenceData.googleSheets[data.refKey] = spreadsheetValues;
      }
    } else if (data.type === 'update') {
      result = await updateSpreadsheetValues(data, this.referenceData.table);
    }

    return {
      nextBlockId,
      data: result,
    };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

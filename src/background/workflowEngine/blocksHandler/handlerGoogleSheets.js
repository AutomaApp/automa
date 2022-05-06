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
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.statusMessage);
  }

  const sheetsData = firstRowAsKey
    ? convert2DArrayToArrayObj(result.values)
    : result.values;

  return sheetsData;
}
async function getSpreadsheetRange({ spreadsheetId, range }) {
  const response = await googleSheets.getRange({ spreadsheetId, range });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.statusMessage);
  }

  const data = {
    tableRange: result.tableRange || null,
    lastRange: result.updates.updatedRange,
  };

  return data;
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
      values = columns.map((item) =>
        Object.values(item).map((value) =>
          typeof value === 'object' ? JSON.stringify(value) : value
        )
      );
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

  if (!response.ok) {
    const error = await response.json();

    throw new Error(error.statusMessage);
  }
}

export default async function ({ data, outputs }, { refData }) {
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
        refData.googleSheets[data.refKey] = spreadsheetValues;
      }
    } else if (data.type === 'getRange') {
      result = await getSpreadsheetRange(data);

      if (data.assignVariable) {
        this.setVariable(data.variableName, result);
      }
      if (data.saveData) {
        this.addDataToColumn(data.dataColumn, result);
      }
    } else if (data.type === 'update') {
      result = await updateSpreadsheetValues(data, refData.table);
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

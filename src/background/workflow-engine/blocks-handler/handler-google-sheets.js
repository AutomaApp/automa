import { getBlockConnection } from '../helper';
import { getGoogleSheetsValue } from '@/utils/api';
import { convert2DArrayToArrayObj, isWhitespace } from '@/utils/helper';

async function getSpreadsheetValues(data) {
  const response = await getGoogleSheetsValue(data.spreadsheetId, data.range);

  if (response.status !== 200) {
    throw new Error(response.statusText);
  }

  const { values } = await response.json();
  const sheetsData = data.firstRowAsKey
    ? convert2DArrayToArrayObj(values)
    : values;

  return sheetsData;
}

export default async function ({ data, outputs }) {
  const nextBlockId = getBlockConnection({ outputs });

  try {
    if (isWhitespace(data.spreadsheetId))
      throw new Error('empty-spreadsheet-id');
    if (isWhitespace(data.range)) throw new Error('empty-spreadsheet-range');

    let result = '';

    if (data.type === 'get') {
      const spreadsheetValues = await getSpreadsheetValues(data);

      result = spreadsheetValues;

      if (data.refKey && !isWhitespace(data.refKey)) {
        this.googleSheets[data.refKey] = spreadsheetValues;
      }
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

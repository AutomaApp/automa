import googleSheetsApi from '@/utils/googleSheetsApi';
import {
  convert2DArrayToArrayObj,
  convertArrObjTo2DArr,
  isWhitespace,
  parseJSON,
} from '@/utils/helper';

async function getSpreadsheetValues({
  spreadsheetId,
  range,
  firstRowAsKey,
  isDriveSheet,
}) {
  const response = await googleSheetsApi(isDriveSheet).getValues({
    spreadsheetId,
    range,
  });

  const result = isDriveSheet ? response : await response.json();
  if (!isDriveSheet && !response.ok) {
    throw new Error(result.message);
  }

  const sheetsData = firstRowAsKey
    ? convert2DArrayToArrayObj(result.values)
    : result.values;

  return sheetsData;
}
async function getSpreadsheetRange({ spreadsheetId, range, isDriveSheet }) {
  const response = await googleSheetsApi(isDriveSheet).getRange({
    spreadsheetId,
    range,
  });

  const result = isDriveSheet ? response : await response.json();
  if (!isDriveSheet && !response.ok) {
    throw new Error(result.message);
  }

  const data = {
    tableRange: result.tableRange || null,
    lastRange: result.updates.updatedRange,
  };

  return data;
}
async function clearSpreadsheetValues({ spreadsheetId, range, isDriveSheet }) {
  const response = await googleSheetsApi(isDriveSheet).clearValues({
    spreadsheetId,
    range,
  });

  const result = isDriveSheet ? response : await response.json();
  if (!isDriveSheet && !response.ok) {
    throw new Error(result.message);
  }

  return result;
}
async function updateSpreadsheetValues(
  {
    range,
    append,
    dataFrom,
    customData,
    isDriveSheet,
    spreadsheetId,
    keysAsFirstRow,
    insertDataOption,
    valueInputOption,
  },
  columns
) {
  let values = [];
  if (['data-columns', 'table'].includes(dataFrom)) {
    if (keysAsFirstRow) {
      values = convertArrObjTo2DArr(columns);
    } else {
      values = columns.map((item) => Object.values(item));
    }
  } else if (dataFrom === 'custom') {
    values = parseJSON(customData, customData);
  }

  if (Array.isArray(values)) {
    const validTypes = ['boolean', 'string', 'number'];
    values.forEach((row, rowIndex) => {
      row.forEach((column, colIndex) => {
        if (column && validTypes.includes(typeof column)) return;

        values[rowIndex][colIndex] = ' ';
      });
    });
  }

  const queries = {
    valueInputOption: valueInputOption || 'RAW',
  };

  if (append) {
    Object.assign(queries, {
      includeValuesInResponse: false,
      insertDataOption: insertDataOption || 'INSERT_ROWS',
    });
  }

  const response = await googleSheetsApi(isDriveSheet).updateValues({
    range,
    append,
    spreadsheetId,
    options: {
      queries,
      body: JSON.stringify({ values }),
    },
  });

  const result = isDriveSheet ? response : await response.json();
  if (!isDriveSheet && !response.ok) {
    throw new Error(result.message);
  }
}

export default async function ({ data, id }, { refData }) {
  const isNotCreateAction = data.type !== 'create';

  if (isWhitespace(data.spreadsheetId) && isNotCreateAction)
    throw new Error('empty-spreadsheet-id');
  if (isWhitespace(data.range) && isNotCreateAction)
    throw new Error('empty-spreadsheet-range');

  let result = [];
  const handleUpdate = async (append = false) => {
    result = await updateSpreadsheetValues(
      {
        ...data,
        append,
      },
      refData.table
    );
  };
  const actionHandlers = {
    get: async () => {
      const spreadsheetValues = await getSpreadsheetValues(data);

      result = spreadsheetValues;

      if (data.refKey && !isWhitespace(data.refKey)) {
        refData.googleSheets[data.refKey] = spreadsheetValues;
      }
    },
    getRange: async () => {
      result = await getSpreadsheetRange(data);

      if (data.assignVariable) {
        this.setVariable(data.variableName, result);
      }
      if (data.saveData) {
        this.addDataToColumn(data.dataColumn, result);
      }
    },
    update: () => handleUpdate(),
    append: () => handleUpdate(true),
    clear: async () => {
      result = await clearSpreadsheetValues(data);
    },
    create: async () => {
      const { spreadsheetId } = await googleSheetsApi(true).create(
        data.sheetName
      );
      result = spreadsheetId;

      if (data.assignVariable) {
        this.setVariable(data.variableName, result);
      }
      if (data.saveData) {
        this.addDataToColumn(data.dataColumn, result);
      }
    },
  };
  await actionHandlers[data.type]();

  return {
    data: result,
    nextBlockId: this.getBlockConnections(id),
  };
}

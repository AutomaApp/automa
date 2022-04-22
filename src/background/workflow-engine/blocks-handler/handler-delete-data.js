import { getBlockConnection } from '../helper';

function deleteData({ data, outputs }) {
  return new Promise((resolve) => {
    data.deleteList.forEach((item) => {
      if (item.type === 'table') {
        if (item.columnId === '[all]') {
          this.referenceData.table = [];
          this.columns = { column: { index: 0, name: 'column', type: 'any' } };
        } else {
          const columnName = this.columns[item.columnId].name;

          this.referenceData.table.forEach((_, index) => {
            const row = this.referenceData.table[index];
            delete row[columnName];

            if (!row || Object.keys(row).length === 0) {
              this.referenceData.table[index] = {};
            }
          });

          this.columns[item.columnId].index = 0;
        }
      } else if (item.variableName) {
        delete this.referenceData.variables[item.variableName];
      }
    });

    resolve({
      data: '',
      nextBlockId: getBlockConnection({ outputs }),
    });
  });
}

export default deleteData;

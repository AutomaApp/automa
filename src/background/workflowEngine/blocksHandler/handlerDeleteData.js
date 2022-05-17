import { getBlockConnection } from '../helper';

function deleteData({ data, outputs }) {
  return new Promise((resolve) => {
    data.deleteList.forEach((item) => {
      if (item.type === 'table') {
        if (item.columnId === '[all]') {
          this.engine.referenceData.table = [];

          Object.keys(this.engine.columns).forEach((key) => {
            this.engine.columns[key].index = 0;
          });
        } else {
          const columnName = this.engine.columns[item.columnId].name;

          this.engine.referenceData.table.forEach((_, index) => {
            const row = this.engine.referenceData.table[index];
            delete row[columnName];

            if (!row || Object.keys(row).length === 0) {
              this.engine.referenceData.table[index] = {};
            }
          });

          this.engine.columns[item.columnId].index = 0;
        }
      } else if (item.variableName) {
        delete this.engine.referenceData.variables[item.variableName];
      }
    });

    resolve({
      data: '',
      nextBlockId: getBlockConnection({ outputs }),
    });
  });
}

export default deleteData;

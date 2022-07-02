import { parseJSON } from '@/utils/helper';
import mustacheReplacer from '@/utils/referenceData/mustacheReplacer';

function insertData({ id, data }, { refData }) {
  return new Promise((resolve) => {
    const replacedValueList = {};
    data.dataList.forEach(({ name, value, type }) => {
      const replacedValue = mustacheReplacer(value, refData);
      const realValue = parseJSON(replacedValue.value, replacedValue.value);

      Object.assign(replacedValueList, replacedValue.list);

      if (type === 'table') {
        this.addDataToColumn(name, realValue);
      } else {
        this.setVariable(name, realValue);
      }
    });

    resolve({
      data: '',
      replacedValue: replacedValueList,
      nextBlockId: this.getBlockConnections(id),
    });
  });
}

export default insertData;

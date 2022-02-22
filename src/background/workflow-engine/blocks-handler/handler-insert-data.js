import { getBlockConnection } from '../helper';
import { parseJSON } from '@/utils/helper';
import mustacheReplacer from '@/utils/reference-data/mustache-replacer';

function delay({ outputs, data }, { refData }) {
  return new Promise((resolve) => {
    data.dataList.forEach(({ name, value, type }) => {
      const replacedValue = mustacheReplacer(value, refData);
      const realValue = parseJSON(replacedValue, replacedValue);

      if (type === 'table') {
        this.addDataToColumn(name, realValue);
      } else {
        this.referenceData.variables[name] = realValue;
      }
    });

    resolve({
      nextBlockId: getBlockConnection({ outputs }),
    });
  });
}

export default delay;

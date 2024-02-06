import objectPath from 'object-path';
import { parseJSON, isXPath } from '@/utils/helper';

async function loopData({ data, id }, { refData }) {
  try {
    if (this.loopList[data.loopId]) {
      const index = this.loopList[data.loopId].index + 1;

      this.loopList[data.loopId].index = index;

      let currentLoopData;

      if (data.loopThrough === 'numbers') {
        currentLoopData = refData.loopData[data.loopId].data + 1;
      } else {
        currentLoopData = this.loopList[data.loopId].data[index];
      }

      refData.loopData[data.loopId] = {
        data: currentLoopData,
        $index: index,
      };
    } else {
      const maxLoop = +data.maxLoop || 0;
      const getLoopData = {
        numbers: () => data.fromNumber,
        table: () => refData.table,
        'custom-data': () => JSON.parse(data.loopData),
        'data-columns': () => refData.table,
        'google-sheets': () => refData.googleSheets[data.referenceKey],
        variable: () => {
          let variableVal = objectPath.get(
            refData.variables,
            data.variableName
          );

          if (Array.isArray(variableVal)) return variableVal;

          variableVal = parseJSON(variableVal, variableVal);

          switch (typeof variableVal) {
            case 'string':
              variableVal = variableVal.split('');
              break;
            case 'number':
              variableVal = Array.from(
                { length: variableVal },
                (_, index) => index + 1
              );
              break;
            default:
          }

          return variableVal;
        },
        elements: async () => {
          const findBy = isXPath(data.elementSelector)
            ? 'xpath'
            : 'cssSelector';
          const { elements, url, loopId } = await this._sendMessageToTab({
            id,
            label: 'loop-data',
            data: {
              findBy,
              max: maxLoop,
              multiple: true,
              reverseLoop: data.reverseLoop,
              selector: data.elementSelector,
              waitForSelector: data.waitForSelector ?? false,
              waitSelectorTimeout: data.waitSelectorTimeout ?? 5000,
            },
          });
          this.loopEls.push({
            url,
            loopId,
            findBy,
            max: maxLoop,
            blockId: id,
            selector: data.elementSelector,
          });

          return elements;
        },
      };

      const currLoopData = await getLoopData[data.loopThrough]();
      let index = 0;

      if (data.loopThrough !== 'numbers') {
        if (!Array.isArray(currLoopData)) {
          throw new Error('invalid-loop-data');
        }

        const startIndex = +data.startIndex;

        if (data.resumeLastWorkflow && this.engine.isPopup) {
          index = JSON.parse(localStorage.getItem(`index:${id}`)) || 0;
        } else if (!Number.isNaN(startIndex) && startIndex > 0) {
          index = startIndex;
        }

        if (data.reverseLoop && data.loopThrough !== 'elements') {
          currLoopData.reverse();
        }
      }

      this.loopList[data.loopId] = {
        index,
        blockId: id,
        id: data.loopId,
        data: currLoopData,
        type: data.loopThrough,
        maxLoop:
          data.loopThrough === 'numbers'
            ? data.toNumber + 1 - data.fromNumber
            : maxLoop,
      };
      /* eslint-disable-next-line */
      refData.loopData[data.loopId] = {
        data:
          data.loopThrough === 'numbers'
            ? data.fromNumber
            : currLoopData[index],
        $index: index,
      };
      this.engine.addRefDataSnapshot('loopData');
    }

    if (this.engine.isPopup) {
      localStorage.setItem(`index:${id}`, this.loopList[data.loopId].index);
    }

    return {
      data: refData.loopData[data.loopId],
      nextBlockId: this.getBlockConnections(id),
    };
  } catch (error) {
    if (data.loopThrough === 'elements') {
      error.data = { selector: data.elementSelector };
    }

    throw error;
  }
}

export default loopData;

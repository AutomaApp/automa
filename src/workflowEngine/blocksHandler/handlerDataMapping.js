import objectPath from 'object-path';
import { objectHasKey, isObject } from '@/utils/helper';

function mapData(data, sources) {
  const mappedData = {};

  sources.forEach((source) => {
    const dataExist = objectPath.has(data, source.name);
    if (!dataExist) return;

    const value = objectPath.get(data, source.name);

    source.destinations.forEach(({ name }) => {
      objectPath.set(mappedData, name, value);
    });
  });

  return mappedData;
}

export async function dataMapping({ id, data }) {
  let dataToMap = null;

  if (data.dataSource === 'table') {
    dataToMap = this.engine.referenceData.table;
  } else if (data.dataSource === 'variable') {
    const { variables } = this.engine.referenceData;

    if (!objectHasKey(variables, data.varSourceName)) {
      throw new Error(`Cant find "${data.varSourceName}" variable`);
    }

    dataToMap = variables[data.varSourceName];
  }

  if (!isObject(dataToMap) && !Array.isArray(dataToMap)) {
    const dataType = dataToMap === null ? 'null' : typeof dataToMap;

    throw new Error(`Can't map data with "${dataType}" data type`);
  }

  if (isObject(dataToMap)) {
    dataToMap = mapData(dataToMap, data.sources);
  } else {
    dataToMap = dataToMap.map((item) => mapData(item, data.sources));
  }

  if (data.assignVariable) {
    await this.setVariable(data.variableName, dataToMap);
  }
  if (data.saveData) {
    this.addDataToColumn(data.dataColumn, dataToMap);
  }

  return {
    data: dataToMap,
    nextBlockId: this.getBlockConnections(id),
  };
}

export default dataMapping;

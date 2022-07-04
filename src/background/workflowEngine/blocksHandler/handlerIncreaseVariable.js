import { objectHasKey } from '@/utils/helper';

export async function logData({ id, data }) {
  const refVariables = this.engine.referenceData.variables;

  if (!objectHasKey(refVariables, data.variableName)) {
    throw new Error(`Cant find "${data.variableName}" variable`);
  }

  const currentVar = refVariables[data.variableName];
  if (typeof currentVar !== 'number') {
    throw new Error(
      `The "${data.variableName}" variable value is not a number`
    );
  }

  refVariables[data.variableName] += data.increaseBy;

  return {
    data: refVariables[data.variableName],
    nextBlockId: this.getBlockConnections(id),
  };
}

export default logData;

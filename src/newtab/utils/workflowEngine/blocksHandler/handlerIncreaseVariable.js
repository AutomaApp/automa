import objectPath from 'object-path';

export async function increaseVariable({ id, data }) {
  const refVariables = this.engine.referenceData.variables;
  const variableExist = objectPath.has(refVariables, data.variableName);

  if (!variableExist) {
    throw new Error(`Cant find "${data.variableName}" variable`);
  }

  const currentVar = +objectPath.get(refVariables, data.variableName);
  if (Number.isNaN(currentVar)) {
    throw new Error(
      `The "${data.variableName}" variable value is not a number`
    );
  }

  objectPath.set(
    this.engine.referenceData.variables,
    data.variableName,
    currentVar + data.increaseBy
  );

  return {
    data: refVariables[data.variableName],
    nextBlockId: this.getBlockConnections(id),
  };
}

export default increaseVariable;

import objectPath from 'object-path';

export async function sliceData({ id, data }) {
  const variable = objectPath.get(
    this.engine.referenceData.variables,
    data.variableName
  );
  const payload = {
    data: variable,
    nextBlockId: this.getBlockConnections(id),
  };

  if (!variable || !variable?.slice) return payload;

  let startIndex = 0;
  let endIndex = variable.length;

  if (data.startIdxEnabled) {
    startIndex = data.startIndex;
  }
  if (data.endIdxEnabled) {
    endIndex = data.endIndex;
  }

  const slicedVariable = variable.slice(startIndex, endIndex);
  payload.data = slicedVariable;
  objectPath.set(
    this.engine.referenceData.variables,
    data.variableName,
    slicedVariable
  );

  return payload;
}

export default sliceData;

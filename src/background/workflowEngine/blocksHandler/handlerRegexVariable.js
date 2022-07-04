import { objectHasKey } from '@/utils/helper';

export async function regexVariable({ id, data }) {
  const refVariables = this.engine.referenceData.variables;

  if (!objectHasKey(refVariables, data.variableName)) {
    throw new Error(`Cant find "${data.variableName}" variable`);
  }

  const currentVar = refVariables[data.variableName];
  if (typeof currentVar !== 'string') {
    throw new Error(
      `The value of the "${data.variableName}" variable is not a string/text`
    );
  }

  const regex = new RegExp(data.expression, data.flag.join(''));
  const matches = currentVar.match(regex);
  const newValue = matches && !data.flag.includes('g') ? matches[0] : matches;

  refVariables[data.variableName] = newValue;

  return {
    data: newValue,
    nextBlockId: this.getBlockConnections(id),
  };
}

export default regexVariable;

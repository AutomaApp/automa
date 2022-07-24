import { objectHasKey } from '@/utils/helper';

export async function regexVariable({ id, data }) {
  const refVariables = this.engine.referenceData.variables;

  if (!objectHasKey(refVariables, data.variableName)) {
    throw new Error(`Cant find "${data.variableName}" variable`);
  }

  const str = refVariables[data.variableName];
  if (typeof str !== 'string') {
    throw new Error(
      `The value of the "${data.variableName}" variable is not a string/text`
    );
  }

  const method = data.method || 'match';
  const regex = new RegExp(data.expression, data.flag.join(''));

  let newValue = '';

  if (method === 'match') {
    const matches = str.match(regex);
    newValue = matches && !data.flag.includes('g') ? matches[0] : matches;
  } else if (method === 'replace') {
    newValue = str.replace(regex, data.replaceVal ?? '');
  }

  refVariables[data.variableName] = newValue;

  return {
    data: newValue,
    nextBlockId: this.getBlockConnections(id),
  };
}

export default regexVariable;

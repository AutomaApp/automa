import { messageSandbox } from '../helper';
import mustacheReplacer from './mustacheReplacer';

export default async function (str, data) {
  if (!str || typeof str !== 'string') return '';

  let renderedValue = {};
  if (str.startsWith('!#')) {
    renderedValue = await messageSandbox('blockExpression', { str, data });
  } else {
    renderedValue = mustacheReplacer(str, data);
  }

  return renderedValue;
}

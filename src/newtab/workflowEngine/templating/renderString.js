import { messageSandbox } from '../helper';
import mustacheReplacer from './mustacheReplacer';

const isFirefox = BROWSER_TYPE === 'firefox';

export default async function (str, data) {
  if (!str || typeof str !== 'string') return '';

  const hasMustacheTag = /\{\{(.*?)\}\}/.test(str);
  if (!hasMustacheTag) {
    return {
      list: {},
      value: str,
    };
  }

  let renderedValue = {};
  if (str.startsWith('!!') && !isFirefox) {
    const refKeysRegex =
      /(variables|table|secrets|loopData|workflow|googleSheets|globalData)@/g;
    const strToRender = str.replace(refKeysRegex, '$1.');

    renderedValue = await messageSandbox('blockExpression', {
      str: strToRender,
      data,
    });
  } else {
    renderedValue = mustacheReplacer(str, data);
  }

  return renderedValue;
}

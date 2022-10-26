import * as tmpl from '@n8n_io/riot-tmpl';
import functions from '@/newtab/workflowEngine/templating/templatingFunctions';

tmpl.brackets.set('{{ }}');

const templatingFunctions = Object.keys(functions).reduce((acc, funcName) => {
  acc[`$${funcName}`] = functions[funcName];

  return acc;
}, {});

export default function ({ str, data }, sendResponse) {
  const value = tmpl.tmpl(str, { ...data, ...templatingFunctions });

  sendResponse({
    list: {},
    value: value.slice(2),
  });
}

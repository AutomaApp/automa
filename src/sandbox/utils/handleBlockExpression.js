import tmpl from '@/lib/tmpl';
import functions from '@/workflowEngine/templating/templatingFunctions';

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

import objectPath from 'object-path';
import handleConditionCode from './utils/handleConditionCode';
import handleJavascriptBlock from './utils/handleJavascriptBlock';
import handleBlockExpression from './utils/handleBlockExpression';

window.$getNestedProperties = objectPath.get;

const eventHandlers = {
  conditionCode: handleConditionCode,
  blockExpression: handleBlockExpression,
  javascriptBlock: handleJavascriptBlock,
};

window.addEventListener('message', ({ data }) => {
  if (!data.id || !data.type || !eventHandlers[data.type]) return;

  function sendResponse(payload) {
    window.top.postMessage(
      {
        id: data.id,
        type: 'sandbox',
        result: payload,
      },
      '*'
    );
  }

  eventHandlers[data.type](data, sendResponse);
});

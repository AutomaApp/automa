import { toCamelCase } from '@/utils/helper';

const blocksHandler = require.context('./blocks-handler', false, /\.js$/);
const handlers = blocksHandler.keys().reduce(
  (acc, fileName) => {
    const isDebugHandler = fileName.includes('.debug');
    const name = toCamelCase(
      fileName.replace(/^\.\/handler-|\.debug|\.js/g, '')
    );

    const blockKey = toCamelCase(name);
    const handler = blocksHandler(fileName).default;

    if (isDebugHandler) {
      acc.debug[blockKey] = handler;
    } else {
      acc[blockKey] = handler;
    }

    return acc;
  },
  { debug: {} }
);

export default handlers;

import { toCamelCase } from '@/utils/helper';

const blocksHandler = require.context('./blocks-handler', false, /\.js$/);
const handlers = blocksHandler.keys().reduce((acc, key) => {
  const name = key.replace(/^\.\/handler-|\.js/g, '');

  acc[toCamelCase(name)] = blocksHandler(key).default;

  return acc;
}, {});

export default handlers;

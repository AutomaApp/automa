import { toCamelCase } from '@/utils/helper';
import customHandlers from '@business/blocks/backgroundHandler';

const blocksHandler = require.context('./blocksHandler', false, /\.js$/);
const handlers = blocksHandler.keys().reduce((acc, key) => {
  const name = key.replace(/^\.\/handler|\.js/g, '');

  acc[toCamelCase(name)] = blocksHandler(key).default;

  return acc;
}, {});

export default function () {
  return {
    ...handlers,
    ...customHandlers(),
  };
}

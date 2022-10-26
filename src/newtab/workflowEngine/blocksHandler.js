import customHandlers from '@business/blocks/backgroundHandler';
import { toCamelCase } from '@/utils/helper';

const blocksHandler = require.context(
  './blocksHandler',
  false,
  /\.js$/,
  'lazy'
);
const handlers = {};

blocksHandler.keys().forEach((key) => {
  const name = key.replace(/^\.\/handler|\.js/g, '');

  blocksHandler(key).then((module) => {
    handlers[toCamelCase(name)] = module.default;
  });
}, {});

export default function () {
  return {
    ...handlers,
    ...customHandlers(),
  };
}

import { toCamelCase } from '@/utils/helper';
import customHandlers from '@business/blocks/contentHandler';

const blockModules = import.meta.glob('./blocksHandler/*.js', { eager: true });
const handlers = Object.entries(blockModules).reduce((acc, [path, mod]) => {
  const name = path
    .split('/')
    .pop()
    .replace(/^handler|\.js$/g, '');
  acc[toCamelCase(name)] = mod.default;
  return acc;
}, {});

export default function () {
  return {
    ...(customHandlers() || {}),
    ...handlers,
  };
}

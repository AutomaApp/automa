import customBlocks from '@business/blocks';
import { tasks } from './shared';

export function getBlocks() {
  return { ...tasks, ...customBlocks() };
}

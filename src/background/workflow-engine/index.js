import Engine from './engine';
import blocksHandler from './blocks-handler';

export default function (workflow, options = {}) {
  const engine = new Engine(workflow, { ...options, blocksHandler });

  return engine;
}

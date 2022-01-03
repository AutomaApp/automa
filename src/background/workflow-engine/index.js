import Engine from './engine';
import blocksHandler from './blocks-handler';

export default function (workflow, { options = {}, states } = {}) {
  const engine = new Engine(workflow, { ...options, states, blocksHandler });

  return engine;
}

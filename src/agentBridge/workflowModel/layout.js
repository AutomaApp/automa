import { normalizePosition } from './common';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 120;
const X_STEP = 280;
const Y_STEP = 160;

function overlaps(first, second) {
  return (
    Math.abs(first.x - second.x) < NODE_WIDTH &&
    Math.abs(first.y - second.y) < NODE_HEIGHT
  );
}

function positionFree(position, occupied) {
  return !occupied.some((item) => overlaps(position, item));
}

function nextOffset(iteration) {
  if (iteration === 0) return 0;

  const distance = Math.ceil(iteration / 2) * Y_STEP;
  return iteration % 2 === 1 ? distance : -distance;
}

export function listOccupiedPositions(blocks = []) {
  return blocks
    .filter((block) => block?.position)
    .map((block) => normalizePosition(block.position));
}

export function placeBlock(blocks = [], options = {}) {
  const sourceBlock = options.sourceId
    ? blocks.find((block) => block.id === options.sourceId)
    : null;
  const basePosition = sourceBlock
    ? normalizePosition(sourceBlock.position)
    : normalizePosition(options.position || { x: 100, y: 100 });
  const occupied = listOccupiedPositions(blocks);

  for (let column = 1; column < 25; column += 1) {
    for (let row = 0; row < 25; row += 1) {
      const position = {
        x: basePosition.x + X_STEP * column,
        y: basePosition.y + nextOffset(row),
      };

      if (positionFree(position, occupied)) return position;
    }
  }

  return {
    x: basePosition.x + X_STEP * (blocks.length + 1),
    y: basePosition.y,
  };
}

export default {
  listOccupiedPositions,
  placeBlock,
};

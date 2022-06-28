import { parseJSON, findTriggerBlock } from './helper';

export default function (workflow) {
  const data =
    typeof workflow.drawflow === 'string'
      ? parseJSON(workflow.drawflow, {})
      : workflow.drawflow;
  if (!data?.drawflow) return workflow;

  const triggerBlock = findTriggerBlock(data);
  if (!triggerBlock) return workflow;

  const blocks = data.drawflow.Home.data;
  const tracedBlocks = new Set();

  const nodes = [];
  const edges = [];

  function extractBlock(blockId) {
    if (tracedBlocks.has(blockId)) return;

    const block = blocks[blockId];

    nodes.push({
      id: block.id,
      type: block.html,
      label: block.name,
      position: {
        x: block.pos_x,
        y: block.pos_y,
      },
      data: block.data,
    });

    const nextBlockIds = [];
    const outputs = Object.values(block.outputs);

    outputs.forEach(({ connections }, outputIndex) => {
      let outputName = outputIndex + 1;

      const isLastIndex = outputs.length - 1 === outputIndex;
      const isConditionsBlock = block.name === 'conditions';
      const isFallbackBlock = block.html === 'BlockBasicWithFallback';
      const isBlockFallback = block.html === 'BlockBasic' && outputName >= 2;
      if (
        (isConditionsBlock || isFallbackBlock || isBlockFallback) &&
        isLastIndex
      ) {
        outputName = 'fallback';
      }

      if (isConditionsBlock && !isLastIndex) {
        outputName = block.data.conditions[outputIndex].id;
      }

      connections.forEach(({ node: outputId, output }) => {
        const sourceHandle = `${block.id}-output-${outputName}`;
        const targetHandle = `${outputId}-${output.replace('_', '-')}`;

        edges.push({
          sourceHandle,
          targetHandle,
          source: block.id,
          target: outputId,
          id: `vueflow__edge-${sourceHandle}-${targetHandle}`,
          class: `source-${sourceHandle} target-${targetHandle}`,
        });

        nextBlockIds.push(outputId);
      });
    });

    tracedBlocks.add(blockId);

    nextBlockIds.forEach((id) => {
      extractBlock(id);
    });
  }
  extractBlock(triggerBlock.id);

  workflow.drawflow = { edges, nodes, x: 0, y: 0, zoom: 0 };

  return workflow;
}

/* eslint-disable */
export default async function (
  { data, id },
  { targetHandle, sourceHandle, prevBlockData }
) {
  const { 1: targetId } = targetHandle.split('input-');
  const input = data.inputs.find((input) => input.id === targetId);
  if (!input) {
    throw new Error('Input not found');
  }

  let block = null;

  data.data.nodes.find((node) => {
    if (node.id === input.blockId) {
      block = node;
    }

    this.engine.blocks[node.id] = { ...node };
  });

  if (!block) {
    throw new Error(`Can't find block for this input`);
  }

  console.log(id, data);
  const connections = {}

  // const connections = data.data.edges.reduce(
  //   (acc, { sourceHandle, target, targetHandle }) => {
  //     // const outputId =

  //     if (!acc[sourceHandle]) acc[sourceHandle] = [];
  //     acc[sourceHandle].push({ id: target, targetHandle, sourceHandle });

  //     return acc;
  //   },
  //   {
  //     [targetId]: [
  //       { id: block.id, sourceHandle, targetId: `${block.id}-input-1` },
  //     ],
  //   }
  // );

  // Object.assign(this.engine.connectionsMap, connections);
  // console.log('MAP:\t', this.engine.connectionsMap);
  return {
    data: prevBlockData,
    nextBlockId: [{ id: block.id }],
  };
}

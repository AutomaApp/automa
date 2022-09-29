export default async function (
  { data, id },
  { targetHandle: prevTarget, prevBlockData }
) {
  if (!this.engine.packagesCache[id]) {
    this.engine.packagesCache[id] = { extracted: false, nodes: {} };
  }

  const pkgCache = this.engine.packagesCache[id];

  const { 1: targetId } = prevTarget.split('input-');
  const addBlockPrefix = (itemId) => `${id}__${itemId}`;
  const hasCache = pkgCache.nodes[targetId];
  if (hasCache)
    return {
      data: prevBlockData,
      nextBlockId: [{ id: hasCache }],
    };

  const input = data.inputs.find((item) => item.id === targetId);
  if (!input) {
    throw new Error('Input not found');
  }
  const block = data.data.nodes.find((node) => node.id === input.blockId);
  pkgCache.nodes[targetId] = addBlockPrefix(block.id);

  const connections = {};

  if (!pkgCache.extracted) {
    const outputsMap = new Set();

    data.inputs.forEach((item) => {
      connections[addBlockPrefix(item.id)] = [
        {
          id: addBlockPrefix(item.blockId),
          targetId: `${addBlockPrefix(block.id)}-input-1`,
        },
      ];
    });
    data.outputs.forEach((output) => {
      outputsMap.add(output.handleId);

      const connection =
        this.engine.connectionsMap[`${id}-output-${output.id}`];
      if (!connection) return;

      connections[addBlockPrefix(output.handleId)] = [...connection];
    });

    data.data.nodes.forEach((node) => {
      const newNodeId = addBlockPrefix(node.id);
      this.engine.blocks[newNodeId] = { ...node, id: newNodeId };
    });

    if (!block) {
      throw new Error(`Can't find block for this input`);
    }

    data.data.edges.forEach(({ sourceHandle, target, targetHandle }) => {
      if (outputsMap.has(sourceHandle)) return;

      const nodeSourceHandle = addBlockPrefix(sourceHandle);
      if (!connections[nodeSourceHandle]) connections[nodeSourceHandle] = [];
      connections[nodeSourceHandle].push({
        id: addBlockPrefix(target),
        sourceHandle: nodeSourceHandle,
        targetHandle: addBlockPrefix(targetHandle),
      });
    });

    pkgCache.extracted = true;
  }

  Object.assign(this.engine.connectionsMap, connections);

  return {
    data: prevBlockData,
    nextBlockId: [{ id: addBlockPrefix(block.id) }],
  };
}

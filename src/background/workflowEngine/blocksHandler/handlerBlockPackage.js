export default async function (
  { data, id },
  { targetHandle: prevTarget, prevBlockData }
) {
  if (!this.engine.packagesCache[id]) {
    this.engine.packagesCache[id] = { extracted: false, nodes: {} };
  }

  const pkgCache = this.engine.packagesCache[id];

  const { 1: targetId } = prevTarget.split('input-');
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
  pkgCache.nodes[targetId] = block.id;

  const connections = {};

  if (!pkgCache.extracted) {
    const outputsMap = new Set();

    data.inputs.forEach((item) => {
      connections[item.id] = [
        { id: item.blockId, targetId: `${block.id}-input-1` },
      ];
    });
    data.outputs.forEach((output) => {
      outputsMap.add(output.handleId);

      const connection =
        this.engine.connectionsMap[`${id}-output-${output.id}`];
      if (!connection) return;

      connections[output.handleId] = [...connection];
    });

    data.data.nodes.forEach((node) => {
      this.engine.blocks[node.id] = { ...node };
    });

    if (!block) {
      throw new Error(`Can't find block for this input`);
    }

    data.data.edges.forEach(({ sourceHandle, target, targetHandle }) => {
      if (outputsMap.has(sourceHandle)) return;

      if (!connections[sourceHandle]) connections[sourceHandle] = [];
      connections[sourceHandle].push({
        id: target,
        targetHandle,
        sourceHandle,
      });
    });

    pkgCache.extracted = true;
  }

  Object.assign(this.engine.connectionsMap, connections);

  return {
    data: prevBlockData,
    nextBlockId: [{ id: block.id }],
  };
}

export function convertData(data, type) {
  let result = data;

  switch (type) {
    case 'integer':
      result = Number.isNaN(data) ? +data?.replace(/\D+/g, '') : data;
      break;
    case 'boolean':
      result = Boolean(data);
      break;
    case 'array':
      result = Array.from(data);
      break;
    default:
  }

  return result;
}

export function getBlockConnection(block, index = 1) {
  const blockId = block.outputs[`output_${index}`]?.connections[0]?.node;

  return blockId;
}

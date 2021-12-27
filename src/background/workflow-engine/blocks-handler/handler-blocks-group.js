import { getBlockConnection } from '../helper';

function blocksGroup({ data, outputs }, { prevBlockData }) {
  return new Promise((resolve) => {
    const nextBlockId = getBlockConnection({ outputs });

    if (data.blocks.length === 0) {
      resolve({
        nextBlockId,
        data: prevBlockData,
      });

      return;
    }

    const blocks = data.blocks.reduce((acc, block, index) => {
      let nextBlock = data.blocks[index + 1]?.itemId;

      if (index === data.blocks.length - 1) {
        nextBlock = nextBlockId;
      }

      acc[block.itemId] = {
        ...block,
        id: block.itemId,
        name: block.id,
        outputs: {
          output_1: {
            connections: [{ node: nextBlock }],
          },
        },
      };

      return acc;
    }, {});

    Object.assign(this.blocks, blocks);

    resolve({
      data: prevBlockData,
      nextBlockId: data.blocks[0].itemId,
    });
  });
}

export default blocksGroup;

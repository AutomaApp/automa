import { getBlocks } from '../getSharedData';

const blocks = getBlocks();
const autocompleteKeys = {
  loopId: 'loopData',
  refKey: 'googleSheets',
  variableName: 'variables',
};

function getData(blockName, blockData) {
  const keys = blocks[blockName]?.autocomplete;
  const dataList = {};
  if (!keys) return dataList;

  keys.forEach((key) => {
    const value = blockData[key];
    if (!value) return;

    const autocompleteKey = autocompleteKeys[key];
    if (!dataList[autocompleteKey]) dataList[autocompleteKey] = {};

    dataList[autocompleteKey][value] = '';
  });

  return dataList;
}

const extractBlocksAutocomplete = {
  trigger(blockId, data) {
    if (!this[blockId].variables) this[blockId].variables = {};

    data.parameters?.forEach((param) => {
      this[blockId].variables[param.name] = '';
    });

    if (data.type === 'context-menu') {
      Object.assign(this[blockId].variables, {
        $ctxElSelector: '',
        $ctxTextSelection: '',
        $ctxLink: '',
        $ctxMediaUrl: '',
      });
    }
  },
  'blocks-group': function (blockId, data) {
    data.blocks.forEach((block) => {
      this[block.itemId] = getData(block.id, block.data);
    });
  },
  'insert-data': function (blockId, data) {
    if (!this[blockId].variables) this[blockId].variables = {};

    data.dataList.forEach((item) => {
      if (item.type !== 'variable' || !item.name.trim()) return;

      this[blockId].variables[item.name] = '';
    });
  },
};

export default function (label, { data, id }) {
  const autocompleteData = { [id]: {} };

  if (extractBlocksAutocomplete[label]) {
    extractBlocksAutocomplete[label].call(autocompleteData, id, data);
  } else {
    autocompleteData[id] = getData(label, data);
  }

  return autocompleteData;
}

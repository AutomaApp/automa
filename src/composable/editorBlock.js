import { reactive, onMounted } from 'vue';
import customBlocks from '@business/blocks';
import { tasks, categories } from '@/utils/shared';

const blocks = {
  ...tasks,
  ...customBlocks,
};

export function useEditorBlock(label) {
  const block = reactive({
    details: {},
    category: {},
  });

  onMounted(() => {
    if (!label) return;

    const details = blocks[label];

    block.details = { id: label, ...details };
    block.category = categories[details.category];
  });

  return block;
}

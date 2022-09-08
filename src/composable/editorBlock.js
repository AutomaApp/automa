import { reactive, onMounted } from 'vue';
import { getBlocks } from '@/utils/getSharedData';
import { categories } from '@/utils/shared';

export function useEditorBlock(label) {
  const blocks = getBlocks();
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

import { reactive, onMounted } from 'vue';
import { tasks, categories } from '@/utils/shared';

export function useEditorBlock(label) {
  const block = reactive({
    details: {},
    category: {},
  });

  onMounted(() => {
    if (!label) return;

    const details = tasks[label];

    block.details = { id: label, ...details };
    block.category = categories[details.category];
  });

  return block;
}

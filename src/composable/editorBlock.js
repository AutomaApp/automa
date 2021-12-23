import { reactive, nextTick } from 'vue';
import { tasks, categories } from '@/utils/shared';

export function useEditorBlock(selector, editor) {
  const block = reactive({
    id: '',
    data: {},
    details: {},
    category: {},
    retrieved: false,
  });

  nextTick(() => {
    const element = document.querySelector(selector);

    if (block.id || !element) return;

    block.id = element.parentElement.parentElement.id.replace('node-', '');

    if (block.id) {
      const { name, data } = editor.getNodeFromId(block.id);
      const details = tasks[name];

      block.details = { id: name, ...details };
      block.data = data || details.data;
      block.category = categories[details.category];
    }

    setTimeout(() => {
      editor.updateConnectionNodes(`node-${block.id}`);
    }, 200);
  });

  block.retrieved = true;

  return block;
}

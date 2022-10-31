import { onMounted, watch, shallowRef } from 'vue';
import blocksValidation from '@/newtab/utils/blocksValidation';

export function useBlockValidation(blockId, data) {
  const errors = shallowRef('');

  onMounted(() => {
    const blockValidation = blocksValidation[blockId];
    if (!blockValidation) return;

    const unwatch = watch(
      data,
      (newData) => {
        blockValidation
          .func(newData)
          .then((blockErrors) => {
            let errorsStr = '';
            blockErrors.forEach((error) => {
              errorsStr += `<li>${error}</li>\n`;
            });

            errors.value =
              errorsStr.trim() &&
              `Issues: <ol class='list-disc list-inside'>${errorsStr}</ol>`;
          })
          .catch((error) => {
            console.error(error);
          })
          .finally(() => {
            if (blockValidation.once) {
              unwatch();
            }
          });
      },
      { deep: true, immediate: true }
    );
  });

  return { errors };
}

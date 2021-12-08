<template>
  <ui-input
    :model-value="data.selector"
    :label="t('workflow.blocks.element-exists.selector')"
    class="mb-1 w-full"
    @change="updateData({ selector: $event })"
  />
  <div class="flex space-x-2">
    <ui-input
      :model-value="data.tryCount"
      :title="t('workflow.blocks.element-exists.tryFor.title')"
      :label="t('workflow.blocks.element-exists.tryFor.label')"
      class="flex-1"
      type="number"
      min="1"
      @change="updateData({ tryCount: +$event })"
    />
    <ui-input
      :model-value="data.timeout"
      :label="t('workflow.blocks.element-exists.timeout.label')"
      :title="t('workflow.blocks.element-exists.timeout.title')"
      class="flex-1"
      type="number"
      min="200"
      @change="updateData({ timeout: +$event })"
    />
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>

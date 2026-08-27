<template>
  <div class="space-y-2">
    <ui-input
      :model-value="data.time"
      :label="t('workflow.blocks.delay.timeLabel')"
      class="w-full"
      type="text"
      @change="updateData({ time: $event })"
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

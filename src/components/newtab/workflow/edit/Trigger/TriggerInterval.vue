<template>
  <div class="flex items-center">
    <ui-input
      :model-value="data.interval"
      :label="t('workflow.blocks.trigger.forms.interval')"
      type="number"
      class="w-full"
      placeholder="1-360"
      min="1"
      max="360"
      @change="
        updateIntervalInput($event, { key: 'interval', min: 1, max: 360 })
      "
    />
    <ui-input
      v-if="!data.fixedDelay"
      :model-value="data.delay"
      type="number"
      class="ml-2 w-full"
      :label="t('workflow.blocks.trigger.forms.delay')"
      min="0"
      max="20"
      placeholder="0-20"
      @change="updateIntervalInput($event, { key: 'delay', min: 0, max: 20 })"
    />
  </div>
  <ui-checkbox
    :model-value="data.fixedDelay"
    block
    class="mt-2"
    @change="emit('update', { fixedDelay: $event })"
  >
    {{ t('workflow.blocks.trigger.fixedDelay') }}
  </ui-checkbox>
</template>
<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update']);

const { t } = useI18n();

function updateIntervalInput(value, { key, min, max }) {
  let num = +value;

  if (num < min) num = min;
  else if (num > max) num = max;

  emit('update', { [key]: num });
}
</script>

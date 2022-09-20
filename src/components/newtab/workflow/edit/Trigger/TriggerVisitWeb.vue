<template>
  <div>
    <ui-input
      :model-value="data.url"
      :placeholder="t('workflow.blocks.trigger.forms.url')"
      class="w-full"
      @change="$emit('update', { url: $event })"
    />
    <ui-checkbox
      :model-value="data.isUrlRegex"
      class="mt-1"
      @change="$emit('update', { isUrlRegex: $event })"
    >
      {{ t('workflow.blocks.trigger.useRegex') }}
    </ui-checkbox>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
defineEmits(['update']);

const { t } = useI18n();
</script>

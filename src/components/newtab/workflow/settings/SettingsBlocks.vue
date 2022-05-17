<template>
  <div class="flex items-center">
    <div class="mr-4 flex-1">
      <p>
        {{ t('workflow.settings.blockDelay.title') }}
      </p>
      <p class="text-gray-600 dark:text-gray-200 text-sm leading-tight">
        {{ t('workflow.settings.blockDelay.description') }}
      </p>
    </div>
    <ui-input
      :model-value="settings.blockDelay"
      type="number"
      @change="updateSetting('blockDelay', +$event)"
    />
  </div>
  <div class="flex items-center pt-4">
    <div class="mr-4 flex-1">
      <p>
        {{ t('workflow.settings.tabLoadTimeout.title') }}
      </p>
      <p class="text-gray-600 dark:text-gray-200 text-sm leading-tight">
        {{ t('workflow.settings.tabLoadTimeout.description') }}
      </p>
    </div>
    <ui-input
      :model-value="settings.tabLoadTimeout"
      type="number"
      min="0"
      max="60000"
      @change="updateSetting('tabLoadTimeout', +$event)"
    />
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  settings: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update']);

const { t } = useI18n();

function updateSetting(key, value) {
  emit('update', { key, value });
}
</script>

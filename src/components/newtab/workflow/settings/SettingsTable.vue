<template>
  <div class="flex items-center">
    <div class="flex-grow">
      <p>
        {{ t('workflow.settings.defaultColumn.title') }}
      </p>
      <p class="text-gray-600 dark:text-gray-200 text-sm leading-tight">
        {{ t('workflow.settings.defaultColumn.description') }}
      </p>
    </div>
    <ui-switch
      :model-value="settings.insertDefaultColumn"
      @change="updateSetting('insertDefaultColumn', $event)"
    />
  </div>
  <transition-expand>
    <div v-if="settings.insertDefaultColumn" class="flex pt-4 items-center">
      <p class="flex-1">
        {{ t('workflow.settings.defaultColumn.name') }}
      </p>
      <ui-input
        :model-value="settings.defaultColumnName"
        :title="t('workflow.settings.defaultColumn.name')"
        @change="updateSetting('defaultColumnName', $event)"
      />
    </div>
  </transition-expand>
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

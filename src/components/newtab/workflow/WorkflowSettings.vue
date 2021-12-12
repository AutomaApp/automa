<template>
  <div class="workflow-settings">
    <div class="mb-6">
      <p class="mb-1">{{ t('workflow.settings.onError.title') }}</p>
      <div class="space-x-4">
        <ui-radio
          v-for="item in onError"
          :key="item.id"
          :model-value="workflow.settings.onError"
          :value="item.id"
          class="mr-4"
          @change="updateWorkflow({ onError: $event })"
        >
          {{ item.name }}
        </ui-radio>
      </div>
    </div>
    <div class="mb-6">
      <p class="mb-1">{{ t('workflow.settings.timeout.title') }}</p>
      <ui-input
        :model-value="workflow.settings.timeout"
        type="number"
        class="w-full max-w-sm"
        @change="updateWorkflow({ timeout: +$event })"
      />
    </div>
    <div>
      <p class="mb-1">
        {{ t('workflow.settings.blockDelay.title') }}
        <span :title="t('workflow.settings.blockDelay.description')">
          &#128712;
        </span>
      </p>
      <ui-input
        :model-value="workflow.settings.blockDelay"
        type="number"
        class="w-full max-w-sm"
        @change="updateWorkflow({ blockDelay: +$event })"
      />
    </div>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';

const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update']);

const { t } = useI18n();

const onError = [
  {
    id: 'keep-running',
    name: t('workflow.settings.onError.items.keepRunning'),
  },
  {
    id: 'stop-workflow',
    name: t('workflow.settings.onError.items.stopWorkflow'),
  },
];

function updateWorkflow(data) {
  emit('update', {
    settings: { ...props.workflow.settings, ...data },
  });
}
</script>

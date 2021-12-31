<template>
  <div class="workflow-settings">
    <div class="mb-6">
      <p class="mb-1">{{ t('workflow.settings.onError.title') }}</p>
      <div class="space-x-4">
        <ui-radio
          v-for="item in onError"
          :key="item.id"
          :model-value="settings.onError"
          :value="item.id"
          class="mr-4"
          @change="settings.onError = $event"
        >
          {{ item.name }}
        </ui-radio>
      </div>
    </div>
    <div class="mb-6">
      <p class="mb-1">{{ t('workflow.settings.timeout.title') }}</p>
      <ui-input
        v-model="settings.timeout"
        type="number"
        class="w-full max-w-sm"
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
        v-model.number="settings.blockDelay"
        type="number"
        class="w-full max-w-sm"
      />
    </div>
    <div class="flex mt-6">
      <ui-switch v-model="settings.saveLog" class="mr-4" />
      <p>Save log</p>
    </div>
  </div>
</template>
<script setup>
import { onMounted, reactive, watch } from 'vue';
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

const settings = reactive({
  blockDelay: 0,
  saveLog: true,
  timeout: 120000,
  onError: 'stop-workflow',
});

watch(
  settings,
  (newSettings) => {
    emit('update', {
      settings: newSettings,
    });
  },
  { deep: true }
);

onMounted(() => {
  Object.assign(settings, props.workflow.settings);
});
</script>

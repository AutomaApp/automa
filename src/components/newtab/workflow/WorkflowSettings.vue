<template>
  <div class="workflow-settings">
    <div class="mb-4">
      <p class="mb-1 capitalize">
        {{ t('workflow.settings.onError.title') }}
      </p>
      <div class="space-x-4 flex w-full max-w-sm items-center">
        <div
          v-for="item in onError"
          :key="item.id"
          class="p-3 rounded-lg border transition-colors w-full hoverable"
          @click="settings.onError = item.id"
        >
          <ui-radio
            :model-value="settings.onError"
            :value="item.id"
            class="capitalize"
            @change="settings.onError = $event"
          >
            {{ item.name }}
          </ui-radio>
        </div>
      </div>
    </div>
    <div>
      <p class="mb-1 capitalize">
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
    <div v-if="false" class="flex mt-6">
      <ui-switch v-model="settings.debugMode" class="mr-4" />
      <p class="capitalize">{{ t('workflow.settings.debugMode') }}</p>
    </div>
    <div class="flex mt-6">
      <ui-switch v-model="settings.saveLog" class="mr-4" />
      <p class="capitalize">{{ t('workflow.settings.saveLog') }}</p>
    </div>
    <div class="flex mt-6">
      <ui-switch v-model="settings.executedBlockOnWeb" class="mr-4" />
      <p class="capitalize">{{ t('workflow.settings.executedBlockOnWeb') }}</p>
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

const settings = reactive({});

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

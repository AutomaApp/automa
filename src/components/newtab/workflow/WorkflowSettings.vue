<template>
  <div class="workflow-settings">
    <div class="mb-4 flex">
      <div class="flex-1">
        <p class="mb-1 capitalize">
          {{ t('workflow.settings.onError.title') }}
        </p>
        <ui-select v-model="settings.onError" class="w-full max-w-sm">
          <option v-for="item in onError" :key="item.id" :value="item.id">
            {{ t(`workflow.settings.onError.items.${item.name}`) }}
          </option>
        </ui-select>
      </div>
      <label v-if="settings.onError === 'restart-workflow'" class="ml-2">
        <p class="mb-1 capitalize">
          {{ t('workflow.settings.restartWorkflow.for') }}
        </p>
        <div class="flex items-center bg-input transition-colors rounded-lg">
          <input
            v-model.number="settings.restartTimes"
            type="number"
            class="py-2 px-4 w-32 rounded-lg bg-transparent"
          />
          <span class="px-2">
            {{ t('workflow.settings.restartWorkflow.times') }}
          </span>
        </div>
      </label>
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
    <div class="flex mt-6">
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
import { debounce } from '@/utils/helper';

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
    name: 'keepRunning',
  },
  {
    id: 'stop-workflow',
    name: 'stopWorkflow',
  },
  {
    id: 'restart-workflow',
    name: 'restartWorkflow',
  },
];

const settings = reactive({
  restartTimes: 3,
});

watch(
  settings,
  debounce((newSettings) => {
    emit('update', {
      settings: newSettings,
    });
  }, 500),
  { deep: true }
);

onMounted(() => {
  Object.assign(settings, props.workflow.settings);
});
</script>

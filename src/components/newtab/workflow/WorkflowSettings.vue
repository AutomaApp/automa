<template>
  <div
    class="workflow-settings space-y-4 divide-y dark:divide-gray-700 divide-gray-100"
  >
    <div class="flex items-center">
      <div class="mr-4 flex-1">
        <p>
          {{ t('workflow.settings.onError.title') }}
        </p>
        <p class="text-gray-600 dark:text-gray-200 text-sm leading-tight">
          {{ t('workflow.settings.onError.description') }}
        </p>
      </div>
      <ui-select v-model="settings.onError">
        <option v-for="item in onError" :key="item.id" :value="item.id">
          {{ t(`workflow.settings.onError.items.${item.name}`) }}
        </option>
      </ui-select>
      <div
        v-if="settings.onError === 'restart-workflow'"
        :title="t('workflow.settings.restartWorkflow.description')"
        class="flex items-center bg-input transition-colors rounded-lg ml-4"
      >
        <input
          v-model.number="settings.restartTimes"
          type="number"
          class="py-2 pl-2 text-right appearance-none w-12 rounded-lg bg-transparent"
        />
        <span class="px-2 text-sm">
          {{ t('workflow.settings.restartWorkflow.times') }}
        </span>
      </div>
    </div>
    <div class="flex items-center pt-4">
      <div class="mr-4 flex-1">
        <p>
          {{ t('workflow.settings.blockDelay.title') }}
        </p>
        <p class="text-gray-600 dark:text-gray-200 text-sm leading-tight">
          {{ t('workflow.settings.blockDelay.description') }}
        </p>
      </div>
      <ui-input v-model.number="settings.blockDelay" type="number" />
    </div>
    <div
      v-for="item in settingItems"
      :key="item.id"
      class="flex items-center pt-4"
    >
      <div class="mr-4 flex-1">
        <p>
          {{ item.name }}
        </p>
        <p class="text-gray-600 dark:text-gray-200 text-sm leading-tight">
          {{ item.description }}
        </p>
      </div>
      <ui-switch v-model="settings[item.id]" class="mr-4" />
    </div>
    <div class="flex items-center pt-4">
      <div class="mr-4 flex-1">
        <p>
          {{ t('workflow.settings.clearCache.title') }}
        </p>
        <p class="text-gray-600 dark:text-gray-200 text-sm leading-tight">
          {{ t('workflow.settings.clearCache.description') }}
        </p>
      </div>
      <ui-button @click="onClearCacheClick">
        {{ t('workflow.settings.clearCache.btn') }}
      </ui-button>
    </div>
  </div>
</template>
<script setup>
import { onMounted, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { clearCache, debounce } from '@/utils/helper';

const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update']);

const { t } = useI18n();
const toast = useToast();

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
const settingItems = [
  {
    id: 'debugMode',
    name: t('workflow.settings.debugMode.title'),
    description: t('workflow.settings.debugMode.description'),
  },
  {
    id: 'inputAutocomplete',
    name: t('workflow.settings.autocomplete.title'),
    description: t('workflow.settings.autocomplete.description'),
  },
  {
    id: 'reuseLastState',
    name: t('workflow.settings.reuseLastState.title'),
    description: t('workflow.settings.reuseLastState.description'),
  },
  {
    id: 'saveLog',
    name: t('workflow.settings.saveLog'),
    description: '',
  },
  {
    id: 'executedBlockOnWeb',
    name: t('workflow.settings.executedBlockOnWeb'),
    description: '',
  },
];

const settings = reactive({
  restartTimes: 3,
  inputAutocomplete: true,
});

async function onClearCacheClick() {
  const cacheCleared = await clearCache(props.workflow);
  if (cacheCleared) toast(t('workflow.settings.clearCache.info'));
}

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

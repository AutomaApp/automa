<template>
  <ui-card padding="p-0" class="workflow-settings w-full max-w-2xl">
    <div class="flex items-center px-4 pt-4">
      <p class="flex-1">
        {{ t('common.settings') }}
      </p>
      <v-remixicon
        name="riCloseLine"
        class="cursor-pointer"
        @click="$emit('close')"
      />
    </div>
    <div class="space-x-2 px-4 pt-2">
      <ui-tabs v-model="activeTab">
        <ui-tab v-for="tab in tabs" :key="tab.value" :value="tab.value">
          {{ tab.name }}
        </ui-tab>
      </ui-tabs>
    </div>
    <ui-tab-panels
      v-model="activeTab"
      class="overflow-auto scroll pt-4 px-4 pb-4"
      style="height: calc(100vh - 10rem); max-height: 600px"
    >
      <ui-tab-panel
        class="space-y-4 space-y-4 divide-y dark:divide-gray-700 divide-gray-100"
        value="general"
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
            <p
              v-if="item.notSupport?.includes(browserType)"
              class="text-sm leading-tight text-red-400 dark:text-red-300"
            >
              {{
                t('log.messages.browser-not-supported', {
                  browser: browserType,
                })
              }}
            </p>
            <p
              v-else
              class="text-gray-600 dark:text-gray-200 text-sm leading-tight"
            >
              {{ item.description }}
            </p>
          </div>
          <ui-switch
            v-if="!item.notSupport?.includes(browserType)"
            v-model="settings[item.id]"
          />
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
      </ui-tab-panel>
      <ui-tab-panel
        class="space-y-4 space-y-4 divide-y dark:divide-gray-700 divide-gray-100"
        value="table"
      >
        <div class="flex items-center">
          <div class="flex-grow">
            <p>
              {{ t('workflow.settings.defaultColumn.title') }}
            </p>
            <p class="text-gray-600 dark:text-gray-200 text-sm leading-tight">
              {{ t('workflow.settings.defaultColumn.description') }}
            </p>
          </div>
          <ui-switch v-model="settings.insertDefaultColumn" />
        </div>
        <transition-expand>
          <div
            v-if="settings.insertDefaultColumn"
            class="flex pt-4 items-center"
          >
            <p class="flex-1">
              {{ t('workflow.settings.defaultColumn.name') }}
            </p>
            <ui-input
              v-model="settings.defaultColumnName"
              :title="t('workflow.settings.defaultColumn.name')"
            />
          </div>
        </transition-expand>
      </ui-tab-panel>
    </ui-tab-panels>
  </ui-card>
</template>
<script setup>
import { onMounted, ref, reactive, watch } from 'vue';
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

const browserType = BROWSER_TYPE;
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
    notSupport: ['firefox'],
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
const tabs = [
  {
    value: 'general',
    name: t('settings.menu.general'),
  },
  {
    value: 'table',
    name: t('workflow.table.title'),
  },
];

const activeTab = ref('general');
const settings = reactive({
  restartTimes: 3,
  inputAutocomplete: true,
  insertDefaultColumn: true,
  defaultColumnName: 'column',
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

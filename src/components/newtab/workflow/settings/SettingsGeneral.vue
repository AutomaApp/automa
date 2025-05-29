<template>
  <div class="flex items-center">
    <div class="mr-4 flex-1">
      <p>
        {{ t('workflow.settings.onError.title') }}
      </p>
      <p class="text-sm leading-tight text-gray-600 dark:text-gray-200">
        {{ t('workflow.settings.onError.description') }}
      </p>
    </div>
    <ui-select
      :model-value="settings.onError"
      @change="updateSetting('onError', $event)"
    >
      <option v-for="item in onError" :key="item.id" :value="item.id">
        {{ t(`workflow.settings.onError.items.${item.name}`) }}
      </option>
    </ui-select>
    <div
      v-if="settings.onError === 'restart-workflow'"
      :title="t('workflow.settings.restartWorkflow.description')"
      class="bg-input ml-4 flex items-center rounded-lg transition-colors"
    >
      <input
        :value="settings.restartTimes ?? 3"
        type="number"
        class="w-12 appearance-none rounded-lg bg-transparent py-2 pl-2 text-right"
        @input="updateSetting('restartTimes', +($event.target.value ?? 3))"
      />
      <span class="px-2 text-sm">
        {{ t('workflow.settings.restartWorkflow.times') }}
      </span>
    </div>
  </div>
  <div v-if="!isFirefox" class="flex items-center pt-4">
    <div class="mr-4 flex-1">
      <p>Workflow Execution</p>
      <p class="text-sm leading-tight text-gray-600 dark:text-gray-200">
        Workflow execution environment (Use "Popup" if workflow runs more than 5
        minutes)
      </p>
    </div>
    <a
      href="https://docs.extension.automa.site/workflow/settings.html#workflow-execution"
      class="mr-2"
      target="_blank"
    >
      <v-remixicon name="riInformationLine" />
    </a>
    <ui-select
      :model-value="settings.execContext || 'popup'"
      @change="updateSetting('execContext', $event)"
    >
      <option value="popup">Popup</option>
      <option value="background">Background</option>
    </ui-select>
  </div>
  <div class="flex items-center pt-4">
    <div class="mr-4 flex-1">
      <p>
        {{ t('workflow.settings.notification.title') }}
      </p>
      <p class="text-sm leading-tight text-gray-600 dark:text-gray-200">
        {{
          t(
            `workflow.settings.notification.${
              permissions.has.notifications ? 'description' : 'noPermission'
            }`
          )
        }}
      </p>
    </div>
    <ui-switch
      v-if="permissions.has.notifications"
      :model-value="settings.notification"
      @change="updateSetting('notification', $event)"
    />
    <ui-button v-else @click="permissions.request(true)">
      {{ t('workflow.blocks.clipboard.grantPermission') }}
    </ui-button>
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
      <p v-else class="text-sm leading-tight text-gray-600 dark:text-gray-200">
        {{ item.description }}
      </p>
    </div>
    <ui-switch
      v-if="!item.notSupport?.includes(browserType)"
      :disabled="item.disabled"
      :model-value="settings[item.id]"
      @change="updateSetting(item.id, $event)"
    />
  </div>
  <div class="flex items-center pt-4">
    <div class="mr-4 flex-1">
      <p>
        {{ t('workflow.settings.clearCache.title') }}
      </p>
      <p class="text-sm leading-tight text-gray-600 dark:text-gray-200">
        {{ t('workflow.settings.clearCache.description') }}
      </p>
    </div>
    <ui-button @click="onClearCacheClick">
      {{ t('workflow.settings.clearCache.btn') }}
    </ui-button>
  </div>
  <div class="flex items-center pt-4">
    <div class="mr-4 flex-1">
      <p>
        {{ t('workflow.settings.publicId.title') }}
      </p>
      <p class="text-sm leading-tight text-gray-600 dark:text-gray-200">
        {{ t('workflow.settings.publicId.description') }}
      </p>
    </div>
    <a
      href="https://docs.extension.automa.site/blocks/trigger.html#trigger-using-js-customevent"
      target="_blank"
      rel="noopener"
      class="mr-2 text-gray-600 dark:text-gray-200"
    >
      <v-remixicon name="riInformationLine" />
    </a>
    <ui-input
      :model-value="settings.publicId"
      placeholder="myWorkflowPublicId"
      @change="updateSetting('publicId', $event)"
    />
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
// import browser from 'webextension-polyfill';
import { useHasPermissions } from '@/composable/hasPermissions';
import { clearCache } from '@/utils/helper';

const props = defineProps({
  settings: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update']);

const { t } = useI18n();
const toast = useToast();
const permissions = useHasPermissions(['notifications']);

const isFirefox = BROWSER_TYPE === 'firefox';
// const isMV2 = browser.runtime.getManifest().manifest_version === 2;

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

async function onClearCacheClick() {
  const cacheCleared = await clearCache(props.workflow);
  if (cacheCleared) toast(t('workflow.settings.clearCache.info'));
}
function updateSetting(key, value) {
  emit('update', { key, value });
}
</script>

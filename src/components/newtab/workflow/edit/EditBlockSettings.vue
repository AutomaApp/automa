<template>
  <div class="block-settings">
    <slot
      name="button"
      :active="state.onError.enable"
      :show="() => (state.showModal = true)"
    >
      <ui-button
        :class="{ 'text-primary': state.onError.enable }"
        @click="state.showModal = true"
      >
        <v-remixicon name="riShieldLine" class="-ml-1 mr-2" />
        <span>
          {{ t('workflow.blocks.base.settings.title') }}
        </span>
      </ui-button>
    </slot>
    <ui-modal
      v-model="state.showModal"
      :title="t('workflow.blocks.base.settings.title')"
      content-class="max-w-xl modal-block-settings"
    >
      <ui-tabs v-model="state.activeTab" class="-mt-2">
        <ui-tab v-for="tab in tabs" :key="tab.id" :value="tab.id">
          {{ tab.name }}
        </ui-tab>
      </ui-tabs>
      <ui-tab-panels
        v-if="state.retrieved"
        v-model="state.activeTab"
        class="mt-4"
      >
        <ui-tab-panel value="general">
          <block-setting-general
            v-model:data="state.settings"
            @change="onDataChange('settings', $event)"
          />
        </ui-tab-panel>
        <ui-tab-panel value="on-error">
          <slot name="on-error">
            <block-setting-on-error
              :data="state.onError"
              @change="onDataChange('onError', $event)"
            />
          </slot>
        </ui-tab-panel>
        <ui-tab-panel value="lines">
          <block-setting-lines :block-id="data.blockId" />
        </ui-tab-panel>
      </ui-tab-panels>
    </ui-modal>
  </div>
</template>
<script setup>
import { reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import defu from 'defu';
import { excludeOnError } from '@/utils/shared';
import BlockSettingLines from './BlockSetting/BlockSettingLines.vue';
import BlockSettingOnError from './BlockSetting/BlockSettingOnError.vue';
import BlockSettingGeneral from './BlockSetting/BlockSettingGeneral.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  onErrorLabel: {
    type: String,
    default: '',
  },
});
const emit = defineEmits(['change']);

const { t } = useI18n();

let currActiveTab = 'on-error';
const browserType = BROWSER_TYPE;
const supportedBlocks = ['forms', 'event-click', 'trigger-event', 'press-key'];
const tabs = [
  {
    id: 'on-error',
    name: props.onErrorLabel || t('workflow.blocks.base.onError.button'),
  },
  { id: 'lines', name: t('workflow.blocks.base.settings.line.title') },
];
const isOnErrorSupported = !excludeOnError.includes(props.data.id);
const isDebugSupported =
  browserType !== 'firefox' && supportedBlocks.includes(props.data.id);

if (isDebugSupported) {
  currActiveTab = 'general';
  tabs.unshift({ id: 'general', name: t('settings.menu.general') });
} else if (!isOnErrorSupported) {
  currActiveTab = 'lines';
  tabs.shift();
}

const defaultSettings = {
  onError: {
    retry: false,
    enable: false,
    retryTimes: 1,
    retryInterval: 2,
    toDo: 'error',
    insertData: false,
    dataToInsert: [],
  },
  general: {
    debugMode: false,
  },
};

const state = reactive({
  showModal: false,
  retrieved: false,
  activeTab: currActiveTab,
  onError: defaultSettings.onError,
  settings: defaultSettings.general,
});

function onDataChange(key, data) {
  if (!state.retrieved || !state.showModal) return;

  state[key] = data;
  emit('change', { [key]: data });
}

onMounted(() => {
  const onErrorSetting = defu(
    props.data.data.onError || {},
    defaultSettings.onError
  );
  state.onError = onErrorSetting;

  const generalSettings = defu(
    props.data.data.settings,
    defaultSettings.general
  );
  state.settings = generalSettings;

  setTimeout(() => {
    state.retrieved = true;
  }, 1000);
});
</script>
<style>
.modal-block-settings {
  min-height: 500px;
}
</style>

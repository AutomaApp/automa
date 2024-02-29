<template>
  <ui-tabs v-model="state.activeTab" class="-mt-2">
    <ui-tab v-for="tab in tabs" :key="tab.id" :value="tab.id">
      {{ tab.name }}
    </ui-tab>
  </ui-tabs>
  <ui-tab-panels v-if="state.retrieved" v-model="state.activeTab" class="mt-4">
    <ui-tab-panel value="general">
      <block-setting-general
        v-model:data="state.settings"
        :block="data"
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
  show: Boolean,
});
const emit = defineEmits(['change', 'close']);

const { t } = useI18n();

const currActiveTab = 'general';
const isOnErrorSupported = !excludeOnError.includes(props.data.id);
const tabs = [
  { id: 'general', name: t('settings.menu.general') },
  {
    id: 'on-error',
    name: props.onErrorLabel || t('workflow.blocks.base.onError.button'),
  },
  { id: 'lines', name: t('workflow.blocks.base.settings.line.title') },
];

if (props.data?.itemId) {
  tabs.pop();
}
if (!isOnErrorSupported) {
  const onErrorTabIndex = tabs.findIndex((tab) => tab.id === 'on-error');
  tabs.splice(onErrorTabIndex, 1);
}

const defaultSettings = {
  onError: {
    retry: false,
    enable: false,
    retryTimes: 1,
    retryInterval: 2,
    toDo: 'error',
    errorMessage: '',
    insertData: false,
    dataToInsert: [],
  },
  general: {
    debugMode: false,
  },
};

const state = reactive({
  retrieved: false,
  activeTab: currActiveTab,
  onError: defaultSettings.onError,
  settings: defaultSettings.general,
});

function onDataChange(key, data) {
  if (!state.retrieved) return;

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
  }, 200);
});
</script>
<style>
.modal-block-settings {
  min-height: 500px;
}
</style>

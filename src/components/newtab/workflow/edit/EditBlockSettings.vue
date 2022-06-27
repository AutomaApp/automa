<template>
  <div class="block-settings">
    <ui-button
      :class="{ 'text-primary': state.onError.enable }"
      @click="state.showModal = true"
    >
      <v-remixicon name="riShieldLine" class="-ml-1 mr-2" />
      <span>
        {{ t('workflow.blocks.base.settings.title') }}
      </span>
    </ui-button>
    <ui-modal
      v-model="state.showModal"
      :title="t('workflow.blocks.base.settings.title')"
      content-class="max-w-xl block-settings"
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
        <ui-tab-panel value="on-error">
          <block-setting-on-error
            v-model:data="state.onError"
            @change="onErrorChange"
          />
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
import BlockSettingLines from './BlockSetting/BlockSettingLines.vue';
import BlockSettingOnError from './BlockSetting/BlockSettingOnError.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  editor: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['change']);

const { t } = useI18n();

const tabs = [
  { id: 'on-error', name: t('workflow.blocks.base.onError.button') },
  { id: 'lines', name: t('workflow.blocks.base.settings.line.title') },
];
const defaultSettings = {
  onError: {
    retry: false,
    enable: false,
    retryTimes: 1,
    retryInterval: 2,
    toDo: 'error',
  },
};

const state = reactive({
  showModal: false,
  retrieved: false,
  activeTab: 'on-error',
  onError: defaultSettings.onError,
});

function onErrorChange(data) {
  if (!state.retrieved) return;

  state.onError = data;
  emit('change', data);
}

onMounted(() => {
  const onErrorSetting = defu(
    props.data.data.onError || {},
    defaultSettings.onError
  );

  state.onError = onErrorSetting;
  state.retrieved = true;
});
</script>
<style>
.block-settings {
  min-height: 500px;
}
</style>

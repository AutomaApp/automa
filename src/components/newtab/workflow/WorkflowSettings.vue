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
      <ui-tabs v-model="activeTab" class="space-x-2">
        <ui-tab v-for="tab in tabs" :key="tab.value" :value="tab.value">
          {{ tab.name }}
        </ui-tab>
      </ui-tabs>
    </div>
    <ui-tab-panels
      v-model="activeTab"
      class="scroll settings-content overflow-auto p-4"
      style="height: calc(100vh - 10rem); max-height: 600px"
    >
      <ui-tab-panel v-for="tab in tabs" :key="tab.value" :value="tab.value">
        <component
          :is="tab.component"
          :settings="settings"
          @update="settings[$event.key] = $event.value"
        />
      </ui-tab-panel>
    </ui-tab-panels>
  </ui-card>
</template>
<script setup>
import { onMounted, ref, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import cloneDeep from 'lodash.clonedeep';
import { debounce } from '@/utils/helper';
import SettingsTable from './settings/SettingsTable.vue';
import SettingsBlocks from './settings/SettingsBlocks.vue';
import SettingsEvents from './settings/SettingsEvents.vue';
import SettingsGeneral from './settings/SettingsGeneral.vue';

const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update', 'close']);

const { t } = useI18n();

const tabs = [
  {
    value: 'general',
    component: SettingsGeneral,
    name: t('settings.menu.general'),
  },
  {
    value: 'table',
    component: SettingsTable,
    name: t('workflow.table.title'),
  },
  {
    value: 'blocks',
    component: SettingsBlocks,
    name: t('workflow.blocks.base.title'),
  },
  {
    value: 'events',
    component: SettingsEvents,
    name: t('workflow.events.title'),
  },
];

const activeTab = ref('general');
const settings = reactive({
  publicId: '',
  restartTimes: 3,
  notification: true,
  tabLoadTimeout: 30000,
  inputAutocomplete: true,
  insertDefaultColumn: true,
  defaultColumnName: 'column',
});

watch(
  settings,
  debounce(() => {
    emit('update', { settings });
  }, 500),
  { deep: true }
);

onMounted(() => {
  const copySettings = cloneDeep(props.workflow.settings);
  Object.assign(settings, copySettings);
});
</script>
<style>
.settings-content .ui-tab-panel {
  @apply space-y-4 space-y-4 divide-y dark:divide-gray-700 divide-gray-100;
}
</style>

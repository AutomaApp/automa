<template>
  <div v-if="state.status === 'loading'" class="py-8 text-center">
    <ui-spinner color="text-primary" />
  </div>
  <template v-else-if="state.status === 'idle'">
    <div class="mb-2 flex items-center">
      <ui-input
        v-model="state.fileName"
        :placeholder="t('common.fileName')"
        :title="t('common.fileName')"
      />
      <div class="grow"></div>
      <ui-popover trigger-width>
        <template #trigger>
          <ui-button variant="accent">
            <span>{{ t('log.exportData.title') }}</span>
            <v-remixicon name="riArrowDropDownLine" class="ml-2 -mr-1" />
          </ui-button>
        </template>
        <ui-list class="space-y-1">
          <ui-list-item
            v-for="type in dataExportTypes"
            :key="type.id"
            v-close-popover
            class="cursor-pointer"
            @click="exportData(type.id)"
          >
            {{ t(`log.exportData.types.${type.id}`) }}
          </ui-list-item>
        </ui-list>
      </ui-popover>
    </div>
    <ui-tabs v-if="objectHasKey(logsData, 'table')" v-model="state.activeTab">
      <ui-tab value="table">
        {{ t('workflow.table.title') }}
      </ui-tab>
      <ui-tab value="variables">
        {{ t('workflow.variables.title', 2) }}
      </ui-tab>
    </ui-tabs>
    <shared-codemirror
      :model-value="dataStr"
      :class="editorClass"
      class="rounded-t-none"
      lang="json"
      readonly
    />
  </template>
</template>
<script setup>
import {
  shallowReactive,
  computed,
  defineAsyncComponent,
  onMounted,
} from 'vue';
import { useI18n } from 'vue-i18n';
import dbLogs from '@/db/logs';
import { dataExportTypes } from '@/utils/shared';
import { objectHasKey } from '@/utils/helper';
import dataExporter from '@/utils/dataExporter';

const SharedCodemirror = defineAsyncComponent(() =>
  import('@/components/newtab/shared/SharedCodemirror.vue')
);

const props = defineProps({
  log: {
    type: Object,
    default: () => ({}),
  },
  editorClass: {
    type: String,
    default: '',
  },
});

const { t } = useI18n();

const state = shallowReactive({
  status: 'loading',
  activeTab: 'table',
  fileName: props.log.name,
});
const logsData = {
  table: '',
  variables: '',
};

const dataStr = computed(() => {
  if (state.status !== 'idle') return '';

  return logsData[state.activeTab] ? logsData[state.activeTab] : '';
});

function exportData(type) {
  dataExporter(
    logsData?.table || logsData,
    { name: state.fileName, type },
    true
  );
}

onMounted(async () => {
  const data = await dbLogs.logsData.where('logId').equals(props.log.id).last();

  if (!data) {
    state.status = 'error';
    return;
  }

  Object.keys(data.data).forEach((key) => {
    logsData[key] = JSON.stringify(data.data[key], null, 2);
  });
  state.status = 'idle';
});
</script>

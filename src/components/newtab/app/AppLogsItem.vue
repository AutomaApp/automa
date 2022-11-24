<template>
  <div v-if="currentLog.id">
    <div class="flex items-center">
      <button
        v-tooltip:bottom="t('workflow.blocks.go-back.name')"
        role="button"
        class="h-12 px-1 transition mr-2 bg-input rounded-lg dark:text-gray-300 text-gray-600"
        @click="$emit('close')"
      >
        <v-remixicon name="riArrowLeftSLine" />
      </button>
      <div>
        <h1 class="text-2xl max-w-md text-overflow font-semibold">
          {{ currentLog.name }}
        </h1>
        <p class="text-gray-600 dark:text-gray-200">
          {{
            t(`log.description.text`, {
              status: t(
                `log.description.status.${currentLog.status || 'success'}`
              ),
              date: dayjs(currentLog.startedAt).format('DD MMM'),
              duration: countDuration(currentLog.startedAt, currentLog.endedAt),
            })
          }}
        </p>
      </div>
      <div class="flex-grow"></div>
      <ui-button
        v-if="state.workflowExists"
        v-tooltip="t('log.goWorkflow')"
        icon
        class="mr-4"
        @click="goToWorkflow"
      >
        <v-remixicon name="riExternalLinkLine" />
      </ui-button>
      <ui-button class="text-red-500 dark:text-red-400" @click="deleteLog">
        {{ t('common.delete') }}
      </ui-button>
    </div>
    <ui-tabs v-model="state.activeTab" class="mt-4" @change="onTabChange">
      <ui-tab v-for="tab in tabs" :key="tab.id" class="mr-4" :value="tab.id">
        {{ tab.name }}
      </ui-tab>
    </ui-tabs>
    <ui-tab-panels
      :model-value="state.activeTab"
      class="mt-4 pb-4 overflow-auto scroll px-2"
      style="min-height: 500px; max-height: calc(100vh - 15rem)"
    >
      <ui-tab-panel value="logs">
        <logs-history
          :current-log="currentLog"
          :ctx-data="ctxData"
          :parent-log="parentLog"
        />
      </ui-tab-panel>
      <ui-tab-panel value="table">
        <logs-table :current-log="currentLog" :table-data="tableData" />
      </ui-tab-panel>
      <ui-tab-panel value="variables">
        <logs-variables :current-log="currentLog" />
      </ui-tab-panel>
    </ui-tab-panels>
  </div>
</template>
<script setup>
import { shallowReactive, shallowRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import dbLogs from '@/db/logs';
import dayjs from '@/lib/dayjs';
import { useWorkflowStore } from '@/stores/workflow';
import { countDuration, convertArrObjTo2DArr } from '@/utils/helper';
import LogsTable from '@/components/newtab/logs/LogsTable.vue';
import LogsHistory from '@/components/newtab/logs/LogsHistory.vue';
import LogsVariables from '@/components/newtab/logs/LogsVariables.vue';

const props = defineProps({
  logId: {
    type: String,
    default: '',
  },
});
const emit = defineEmits(['close']);

const { t } = useI18n();
const router = useRouter();
const workflowStore = useWorkflowStore();

const ctxData = shallowRef({});
const parentLog = shallowRef(null);

const tabs = [
  { id: 'logs', name: t('common.log', 2) },
  { id: 'table', name: t('workflow.table.title') },
  { id: 'variables', name: t('workflow.variables.title', 2) },
];

const state = shallowReactive({
  activeTab: 'logs',
  workflowExists: false,
});
const tableData = shallowReactive({
  converted: false,
  body: [],
  header: [],
});
const currentLog = shallowRef({
  history: [],
  data: {
    table: [],
    variables: {},
  },
});

function deleteLog() {
  dbLogs.items
    .where('id')
    .equals(props.logId)
    .delete()
    .then(() => {
      emit('close');
    });
}
function goToWorkflow() {
  const path = `/workflows/${currentLog.value.workflowId}`;

  router.push(path);
  emit('close', true);
}
function convertToTableData() {
  const data = currentLog.value.data?.table;
  if (!data) return;

  const [header] = convertArrObjTo2DArr(data);

  tableData.converted = true;
  tableData.body = data.map((item, index) => ({ ...item, id: index + 1 }));
  tableData.header = header.map((name) => ({
    text: name,
    value: name,
    filterable: true,
  }));
  tableData.header.unshift({ value: 'id', text: '', sortable: false });
}
function onTabChange(value) {
  if (value === 'table' && !tableData.converted) {
    convertToTableData();
  }
}
async function fetchLog() {
  if (!props.logId) return;

  const logDetail = await dbLogs.items.where('id').equals(props.logId).last();
  if (!logDetail) return;

  tableData.body = [];
  tableData.header = [];
  parentLog.value = null;
  tableData.converted = false;

  const [logCtxData, logHistory, logsData] = await Promise.all(
    ['ctxData', 'histories', 'logsData'].map((key) =>
      dbLogs[key].where('logId').equals(props.logId).last()
    )
  );

  ctxData.value = logCtxData?.data || {};
  currentLog.value = {
    history: logHistory?.data || [],
    data: logsData?.data || {},
    ...logDetail,
  };

  state.workflowExists = Boolean(workflowStore.getById(logDetail.workflowId));

  const parentLogId = logDetail.collectionLogId || logDetail.parentLog?.id;
  if (parentLogId) {
    parentLog.value =
      (await dbLogs.items.where('id').equals(parentLogId).last()) || null;
  }
}

watch(() => props.logId, fetchLog, { immediate: true });
</script>
<style>
.logs-details .cm-editor {
  max-height: calc(100vh - 15rem);
}
</style>

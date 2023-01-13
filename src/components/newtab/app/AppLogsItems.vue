<template>
  <div class="logs-list overflow-auto pb-4 pt-1">
    <div class="mb-8 flex items-center">
      <h1 class="flex-1 text-2xl font-semibold">
        {{ $t('common.log', 2) }}
      </h1>
      <v-remixicon
        name="riCloseLine"
        class="cursor-pointer text-gray-600 dark:text-gray-300"
        @click="$emit('close')"
      />
    </div>
    <logs-filters
      :sorts="sortsBuilder"
      :filters="filtersBuilder"
      @clear="clearLogs"
      @updateSorts="sortsBuilder[$event.key] = $event.value"
      @updateFilters="filtersBuilder[$event.key] = $event.value"
    >
      <ui-popover padding="" @click="filtersBuilder.workflowQuery = ''">
        <template #trigger>
          <ui-button>
            <span class="text-overflow text-left" style="max-width: 160px">
              {{ activeWorkflowName }}
            </span>
            <v-remixicon name="riArrowDropDownLine" class="-mr-1 ml-2" />
          </ui-button>
        </template>
        <div class="w-64">
          <div class="p-4">
            <ui-input
              v-model="filtersBuilder.workflowQuery"
              autofocus
              placeholder="Search..."
              class="w-full"
              prepend-icon="riSearch2Line"
            />
            <div class="text-right">
              <span
                class="cursor-pointer text-sm text-gray-600 underline dark:text-gray-300"
                @click="filtersBuilder.workflowId = ''"
              >
                Clear
              </span>
            </div>
          </div>
          <ui-list class="scroll mb-4 max-h-96 space-y-1 overflow-auto px-4">
            <ui-list-item
              v-for="workflow in workflows"
              :key="workflow.id"
              :active="filtersBuilder.workflowId === workflow.id"
              class="cursor-pointer"
              @click="filtersBuilder.workflowId = workflow.id"
            >
              <p class="text-overflow">{{ workflow.name }}</p>
            </ui-list-item>
          </ui-list>
        </div>
      </ui-popover>
    </logs-filters>
    <div v-if="logs" style="min-height: 320px">
      <shared-logs-table
        :logs="logs"
        :modal="true"
        :running="workflowStates"
        class="w-full"
        style="max-height: calc(100vh - 18rem)"
        @select="$emit('select', $event)"
      >
        <template #item-prepend="{ log }">
          <td class="w-8">
            <ui-checkbox
              :model-value="selectedLogs.includes(log.id)"
              class="align-text-bottom"
              @change="toggleSelectedLog($event, log.id)"
            />
          </td>
        </template>
        <template #item-append="{ log }">
          <td class="ml-4 text-right">
            <v-remixicon
              name="riDeleteBin7Line"
              class="inline-block cursor-pointer text-red-500 dark:text-red-400"
              @click="deleteLog(log.id)"
            />
          </td>
        </template>
      </shared-logs-table>
    </div>
    <div class="mt-4 md:flex md:items-center md:justify-between">
      <div>
        {{ t('components.pagination.text1') }}
        <select v-model="pagination.perPage" class="bg-input rounded-md p-1">
          <option v-for="num in [10, 15, 25, 50, 100]" :key="num" :value="num">
            {{ num }}
          </option>
        </select>
        {{ t('components.pagination.text2', { count: filteredLogs.length }) }}
      </div>
      <ui-pagination
        v-model="pagination.currentPage"
        :per-page="pagination.perPage"
        :records="filteredLogs.length"
        class="mt-4 md:mt-0"
      />
    </div>
    <ui-card
      v-if="selectedLogs.length !== 0"
      class="fixed right-0 bottom-0 m-5 space-x-2 shadow-xl"
    >
      <ui-button @click="selectAllLogs">
        {{
          t(
            `log.${
              selectedLogs.length >= logs?.length ? 'deselectAll' : 'selectAll'
            }`
          )
        }}
      </ui-button>
      <ui-button variant="danger" @click="deleteSelectedLogs">
        {{ t('log.deleteSelected') }} ({{ selectedLogs.length }})
      </ui-button>
    </ui-card>
    <ui-modal v-model="exportDataModal.show" content-class="max-w-2xl">
      <template #header>
        <span class="capitalize">{{ t('common.data') }}</span>
      </template>
      <logs-data-viewer
        :log="exportDataModal.log"
        editor-class="logs-list-data"
      />
    </ui-modal>
  </div>
</template>
<script setup>
import { shallowReactive, ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDialog } from '@/composable/dialog';
import dbLogs from '@/db/logs';
import { useWorkflowStore } from '@/stores/workflow';
import { useHostedWorkflowStore } from '@/stores/hostedWorkflow';
import { useLiveQuery } from '@/composable/liveQuery';
import LogsFilters from '@/components/newtab/logs/LogsFilters.vue';
import LogsDataViewer from '@/components/newtab/logs/LogsDataViewer.vue';
import SharedLogsTable from '@/components/newtab/shared/SharedLogsTable.vue';

const props = defineProps({
  workflowId: {
    type: String,
    default: '',
  },
});
defineEmits(['select', 'close']);

const { t } = useI18n();
const dialog = useDialog();
const workflowStore = useWorkflowStore();
const hostedWorkflows = useHostedWorkflowStore();
const storedlogs = useLiveQuery(() => dbLogs.items.toArray());

const savedSorts = JSON.parse(localStorage.getItem('logs-sorts') || '{}');

const selectedLogs = ref([]);
const pagination = shallowReactive({
  perPage: 10,
  currentPage: 1,
});
const filtersBuilder = shallowReactive({
  query: '',
  byDate: 0,
  byStatus: 'all',
  workflowQuery: '',
  workflowId: props.workflowId,
});
const sortsBuilder = shallowReactive({
  order: savedSorts.order || 'desc',
  by: savedSorts.by || 'endedAt',
});
const exportDataModal = shallowReactive({
  show: false,
  log: {},
});

const allWorkflows = computed(() =>
  [...hostedWorkflows.toArray, ...workflowStore.getWorkflows].sort((a, b) =>
    a.createdAt > b.createdAt ? -1 : 1
  )
);
const workflows = computed(() =>
  allWorkflows.value.filter((workflow) =>
    workflow.name
      .toLocaleLowerCase()
      .includes(filtersBuilder.workflowQuery.toLocaleLowerCase())
  )
);
const activeWorkflowName = computed(() => {
  if (!filtersBuilder.workflowId) return 'All workflows';

  const workflow = allWorkflows.value.find(
    (item) => item.id === filtersBuilder.workflowId
  );

  return workflow?.name ?? 'All workflows';
});

const workflowStates = computed(() => {
  const states = workflowStore.getAllStates;
  if (!filtersBuilder.workflowId) return states;

  return states.filter(
    (state) => state.workflowId === filtersBuilder.workflowId
  );
});

const filteredLogs = computed(() => {
  if (!storedlogs.value) return [];

  return storedlogs.value
    .filter(({ name, status, endedAt, workflowId }) => {
      let dateFilter = true;
      let statusFilter = true;
      const workflowIdFilter = filtersBuilder.workflowId
        ? filtersBuilder.workflowId === workflowId
        : true;
      const searchFilter = name
        .toLocaleLowerCase()
        .includes(filtersBuilder.query.toLocaleLowerCase());

      if (filtersBuilder.byStatus !== 'all') {
        statusFilter = status === filtersBuilder.byStatus;
      }

      if (filtersBuilder.byDate > 0) {
        const date = Date.now() - filtersBuilder.byDate * 24 * 60 * 60 * 1000;

        dateFilter = date <= endedAt;
      }

      return searchFilter && workflowIdFilter && statusFilter && dateFilter;
    })
    .slice()
    .sort((a, b) => {
      const valueA = a[sortsBuilder.by];
      const valueB = b[sortsBuilder.by];

      if (sortsBuilder.order === 'asc') return valueA > valueB ? 1 : -1;

      return valueB > valueA ? 1 : -1;
    });
});
const logs = computed(() =>
  filteredLogs.value.slice(
    (pagination.currentPage - 1) * pagination.perPage,
    pagination.currentPage * pagination.perPage
  )
);

function deleteLog(id) {
  dbLogs.items.delete(id).then(() => {
    dbLogs.ctxData.where('logId').equals(id).delete();
    dbLogs.histories.where('logId').equals(id).delete();
    dbLogs.logsData.where('logId').equals(id).delete();
  });
}
function toggleSelectedLog(selected, logId) {
  if (selected) {
    selectedLogs.value.push(logId);
    return;
  }

  const index = selectedLogs.value.indexOf(logId);

  if (index !== -1) selectedLogs.value.splice(index, 1);
}
function deleteSelectedLogs() {
  dialog.confirm({
    title: t('log.delete.title'),
    okVariant: 'danger',
    body: t('log.delete.description'),
    onConfirm: () => {
      dbLogs.items.bulkDelete(selectedLogs.value).then(() => {
        selectedLogs.value = [];
      });
    },
  });
}
function clearLogs() {
  dialog.confirm({
    title: t('log.clearLogs.title'),
    okVariant: 'danger',
    body: t('log.clearLogs.description'),
    onConfirm: () => {
      dbLogs.delete();
    },
  });
}
function selectAllLogs() {
  if (selectedLogs.value.length >= logs.value?.length) {
    selectedLogs.value = [];
    return;
  }

  const logIds = logs?.value.map(({ id }) => id);

  selectedLogs.value = logIds;
}

watch(
  () => sortsBuilder,
  (value) => {
    localStorage.setItem('logs-sorts', JSON.stringify(value));
  },
  { deep: true }
);
</script>
<style>
.logs-list-data {
  max-height: calc(100vh - 12rem);
}
</style>

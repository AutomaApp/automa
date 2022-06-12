<template>
  <div class="container pt-8 pb-4 logs-list">
    <h1 class="text-2xl font-semibold mb-6">{{ t('common.log', 2) }}</h1>
    <logs-filters
      :sorts="sortsBuilder"
      :filters="filtersBuilder"
      @clear="clearLogs"
      @updateSorts="sortsBuilder[$event.key] = $event.value"
      @updateFilters="filtersBuilder[$event.key] = $event.value"
    />
    <div v-if="logs" style="min-height: 320px">
      <shared-logs-table
        :logs="logs"
        :running="$store.state.workflowState"
        class="w-full"
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
              class="text-red-500 inline-block dark:text-red-400 cursor-pointer"
              @click="deleteLog(log.id)"
            />
          </td>
        </template>
      </shared-logs-table>
    </div>
    <div class="flex items-center justify-between mt-4">
      <div>
        {{ t('components.pagination.text1') }}
        <select v-model="pagination.perPage" class="p-1 rounded-md bg-input">
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
      />
    </div>
    <ui-card
      v-if="selectedLogs.length !== 0"
      class="fixed right-0 bottom-0 m-5 shadow-xl space-x-2"
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
import { useLiveQuery } from '@/composable/liveQuery';
import LogsFilters from '@/components/newtab/logs/LogsFilters.vue';
import LogsDataViewer from '@/components/newtab/logs/LogsDataViewer.vue';
import SharedLogsTable from '@/components/newtab/shared/SharedLogsTable.vue';

const { t } = useI18n();
const dialog = useDialog();
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
});
const sortsBuilder = shallowReactive({
  order: savedSorts.order || 'desc',
  by: savedSorts.by || 'endedAt',
});
const exportDataModal = shallowReactive({
  show: false,
  log: {},
});

const filteredLogs = computed(() => {
  if (!storedlogs.value) return [];

  return storedlogs.value
    .filter(({ name, status, endedAt }) => {
      let dateFilter = true;
      let statusFilter = true;
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

      return searchFilter && statusFilter && dateFilter;
    })
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
  dbLogs.items.where('id').equals(id).delete();
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

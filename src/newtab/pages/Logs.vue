<template>
  <div class="container pt-8 pb-4 logs-list">
    <h1 class="text-2xl font-semibold mb-6">{{ t('common.log', 2) }}</h1>
    <logs-filters
      :sorts="sortsBuilder"
      :filters="filtersBuilder"
      @updateSorts="sortsBuilder[$event.key] = $event.value"
      @updateFilters="filtersBuilder[$event.key] = $event.value"
    />
    <div style="min-height: 320px">
      <shared-logs-table :logs="logs" class="w-full">
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
          <td class="ml-4">
            <div class="flex items-center justify-end space-x-4">
              <v-remixicon
                v-if="Object.keys(log.data).length !== 0"
                name="riFileTextLine"
                class="cursor-pointer"
                @click="
                  exportDataModal.show = true;
                  exportDataModal.log = log;
                "
              />
              <v-remixicon
                name="riDeleteBin7Line"
                class="text-red-500 cursor-pointer"
                @click="deleteLog(log.id)"
              />
            </div>
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
              selectedLogs.length >= logs.length ? 'deselectAll' : 'selectAll'
            }`
          )
        }}
      </ui-button>
      <ui-button variant="danger" @click="deleteSelectedLogs">
        {{ t('log.deleteSelected') }} ({{ selectedLogs.length }})
      </ui-button>
    </ui-card>
    <ui-modal v-model="exportDataModal.show">
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
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { useDialog } from '@/composable/dialog';
import Log from '@/models/log';
import LogsFilters from '@/components/newtab/logs/LogsFilters.vue';
import LogsDataViewer from '@/components/newtab/logs/LogsDataViewer.vue';
import SharedLogsTable from '@/components/newtab/shared/SharedLogsTable.vue';

const { t } = useI18n();
const store = useStore();
const dialog = useDialog();

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
  by: savedSorts.by || 'startedAt',
});
const exportDataModal = shallowReactive({
  show: false,
  log: {},
});

const filteredLogs = computed(() =>
  Log.query()
    .where(({ name, status, startedAt, isInCollection, isChildLog }) => {
      if (isInCollection || isChildLog) return false;

      let statusFilter = true;
      let dateFilter = true;
      const searchFilter = name
        .toLocaleLowerCase()
        .includes(filtersBuilder.query.toLocaleLowerCase());

      if (filtersBuilder.byStatus !== 'all') {
        statusFilter = status === filtersBuilder.byStatus;
      }

      if (filtersBuilder.byDate > 0) {
        const date = Date.now() - filtersBuilder.byDate * 24 * 60 * 60 * 1000;

        dateFilter = date <= startedAt;
      }

      return searchFilter && statusFilter && dateFilter;
    })
    .orderBy(sortsBuilder.by, sortsBuilder.order)
    .get()
);
const logs = computed(() =>
  filteredLogs.value.slice(
    (pagination.currentPage - 1) * pagination.perPage,
    pagination.currentPage * pagination.perPage
  )
);

function deleteLog(id) {
  Log.delete(id).then(() => {
    store.dispatch('saveToStorage', 'logs');
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
      const promises = selectedLogs.value.map((logId) => Log.delete(logId));

      Promise.allSettled(promises).then(() => {
        selectedLogs.value = [];
        store.dispatch('saveToStorage', 'logs');
      });
    },
  });
}
function selectAllLogs() {
  if (selectedLogs.value.length >= logs.value.length) {
    selectedLogs.value = [];
    return;
  }

  const logIds = logs.value.map(({ id }) => id);

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

<template>
  <div class="container pt-8 pb-4 logs-list">
    <h1 class="text-2xl font-semibold mb-6">Logs</h1>
    <logs-filters
      :sorts="sortsBuilder"
      :filters="filtersBuilder"
      @updateSorts="sortsBuilder[$event.key] = $event.value"
      @updateFilters="filtersBuilder[$event.key] = $event.value"
    />
    <logs-table :logs="logs" class="w-full">
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
              title="Delete log"
              @click="deleteLog(log.id)"
            />
          </div>
        </td>
      </template>
    </logs-table>
    <ui-card
      v-if="selectedLogs.length !== 0"
      class="fixed right-0 bottom-0 m-5 shadow-xl space-x-2"
    >
      <ui-button @click="selectAllLogs">
        {{ selectedLogs.length >= logs.length ? 'Deselect' : 'Select' }}
        all
      </ui-button>
      <ui-button variant="danger" @click="deleteSelectedLogs">
        Delete selected logs ({{ selectedLogs.length }})
      </ui-button>
    </ui-card>
    <ui-modal v-model="exportDataModal.show">
      <template #header> Data </template>
      <logs-data-viewer
        :log="exportDataModal.log"
        editor-class="logs-list-data"
      />
    </ui-modal>
  </div>
</template>
<script setup>
import { shallowReactive, ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useDialog } from '@/composable/dialog';
import Log from '@/models/log';
import LogsTable from '@/components/newtab/LogsTable.vue';
import LogsFilters from '@/components/newtab/logs/LogsFilters.vue';
import LogsDataViewer from '@/components/newtab/logs/LogsDataViewer.vue';

const store = useStore();
const dialog = useDialog();

const selectedLogs = ref([]);
const filtersBuilder = shallowReactive({
  query: '',
  byDate: 0,
  byStatus: 'all',
});
const sortsBuilder = shallowReactive({
  order: 'desc',
  by: 'startedAt',
});
const exportDataModal = shallowReactive({
  show: false,
  log: {},
});

const logs = computed(() =>
  Log.query()
    .where(({ name, status, startedAt }) => {
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
    title: 'Delete logs',
    okVariant: 'danger',
    body: `Are you sure want to delete all the selected logs?`,
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
</script>
<style>
.logs-list-data {
  max-height: calc(100vh - 12rem);
}
</style>

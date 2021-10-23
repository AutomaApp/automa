<template>
  <div class="container pt-8 pb-4 logs-list">
    <h1 class="text-2xl font-semibold mb-6">Logs</h1>
    <logs-filters
      :sorts="sortsBuilder"
      :filters="filtersBuilder"
      @updateSorts="sortsBuilder[$event.key] = $event.value"
      @updateFilters="filtersBuilder[$event.key] = $event.value"
    />
    <table class="w-full logs-table">
      <tbody>
        <tr v-for="log in logs" :key="log.id" class="hoverable border-b">
          <td class="w-8">
            <ui-checkbox
              :model-value="selectedLogs.includes(log.id)"
              class="align-text-bottom"
              @change="toggleSelectedLog($event, log.id)"
            />
          </td>
          <td style="min-width: 150px">
            <router-link
              :to="`/logs/${log.id}`"
              class="block w-full h-full text-overflow"
            >
              {{ log.name }}
            </router-link>
          </td>
          <td>
            <span
              :class="statusColors[log.status]"
              class="p-1 text-sm rounded-lg w-16 inline-block text-center"
            >
              {{ log.status }}
            </span>
          </td>
          <td class="log-time">
            <v-remixicon
              name="riCalendarLine"
              title="Started date"
            ></v-remixicon>
            <span :title="formatDate(log.startedAt, 'DD MMM YYYY, hh:mm A')">
              {{ formatDate(log.startedAt, 'relative') }}
            </span>
          </td>
          <td class="log-time" title="Duration">
            <v-remixicon name="riTimerLine"></v-remixicon>
            <span>{{ countDuration(log.startedAt, log.endedAt) }}</span>
          </td>
          <td>
            <div
              v-if="log.data"
              class="flex items-center justify-end space-x-4"
            >
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
        </tr>
      </tbody>
    </table>
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
import { countDuration } from '@/utils/helper';
import { statusColors } from '@/utils/shared';
import Log from '@/models/log';
import dayjs from '@/lib/dayjs';
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

function formatDate(date, format) {
  if (format === 'relative') return dayjs(date).fromNow();

  return dayjs(date).format(format);
}
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
<style scoped>
.log-time {
  @apply text-gray-600 dark:text-gray-200;
}
.log-time svg {
  @apply mr-2;
}
.log-time svg,
.log-time span {
  display: inline-block;
  vertical-align: middle;
}
</style>

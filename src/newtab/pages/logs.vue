<template>
  <div class="container pt-8 pb-4 logs-list">
    <h1 class="text-2xl font-semibold mb-6">Logs</h1>
    <div class="flex items-center mb-6 space-x-4">
      <ui-input
        v-model="state.query"
        prepend-icon="riSearch2Line"
        placeholder="Search..."
        class="flex-1"
      />
      <div class="flex items-center workflow-sort">
        <ui-button
          icon
          class="rounded-r-none border-gray-300 border-r"
          @click="state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc'"
        >
          <v-remixicon
            :name="state.sortOrder === 'asc' ? 'riSortAsc' : 'riSortDesc'"
          />
        </ui-button>
        <ui-select v-model="state.sortBy" placeholder="Sort by">
          <option v-for="sort in sorts" :key="sort.id" :value="sort.id">
            {{ sort.name }}
          </option>
        </ui-select>
      </div>
      <ui-select v-model="state.filterBy" placeholder="Filter by status">
        <option v-for="filter in filters" :key="filter" :value="filter">
          {{ filter }}
        </option>
      </ui-select>
    </div>
    <table class="w-full logs-table">
      <tbody>
        <tr v-for="log in logs" :key="log.id" class="hoverable border-b">
          <td class="w-8">
            <ui-checkbox
              :model-value="state.selectedLogs.includes(log.id)"
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
      v-if="state.selectedLogs.length > 1"
      class="fixed right-0 bottom-0 m-5 shadow-xl space-x-2"
    >
      <ui-button @click="selectAllLogs">
        {{ state.selectedLogs.length >= logs.length ? 'Deselect' : 'Select' }}
        all
      </ui-button>
      <ui-button variant="danger" @click="deleteSelectedLogs">
        Delete selected logs ({{ state.selectedLogs.length }})
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
import { shallowReactive, reactive, computed } from 'vue';
import { useStore } from 'vuex';
import { useDialog } from '@/composable/dialog';
import { countDuration } from '@/utils/helper';
import { statusColors } from '@/utils/shared';
import Log from '@/models/log';
import dayjs from '@/lib/dayjs';
import LogsDataViewer from '@/components/newtab/logs/LogsDataViewer.vue';

const filters = ['all', 'success', 'stopped', 'error'];
const sorts = [
  { id: 'name', name: 'Alphabetical' },
  { id: 'startedAt', name: 'Created date' },
];

const store = useStore();
const dialog = useDialog();

const state = reactive({
  query: '',
  filterBy: 'all',
  selectedLogs: [],
  sortOrder: 'desc',
  sortBy: 'startedAt',
});
const exportDataModal = shallowReactive({
  show: false,
  log: {},
});

const logs = computed(() =>
  Log.query()
    .where(({ name, status }) => {
      const searchFilter = name
        .toLocaleLowerCase()
        .includes(state.query.toLocaleLowerCase());

      if (state.filterBy !== 'all') {
        return searchFilter && status === state.filterBy;
      }

      return searchFilter;
    })
    .orderBy(state.sortBy, state.sortOrder)
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
    state.selectedLogs.push(logId);
    return;
  }

  const index = state.selectedLogs.indexOf(logId);

  if (index !== -1) state.selectedLogs.splice(index, 1);
}
function deleteSelectedLogs() {
  dialog.confirm({
    title: 'Delete logs',
    okVariant: 'danger',
    body: `Are you sure want to delete all the selected logs?`,
    onConfirm: () => {
      const promises = state.selectedLogs.map((logId) => Log.delete(logId));

      Promise.allSettled(promises).then(() => {
        state.selectedLogs = [];
        store.dispatch('saveToStorage', 'logs');
      });
    },
  });
}
function selectAllLogs() {
  if (state.selectedLogs.length >= logs.value.length) {
    state.selectedLogs = [];
    return;
  }

  const logIds = logs.value.map(({ id }) => id);

  state.selectedLogs = logIds;
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

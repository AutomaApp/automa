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
import { shallowReactive, computed } from 'vue';
import { useStore } from 'vuex';
import dayjs from '@/lib/dayjs';
import Log from '@/models/log';
import { countDuration } from '@/utils/helper';
import LogsDataViewer from '@/components/newtab/logs/LogsDataViewer.vue';

const filters = ['all', 'success', 'stopped', 'error'];
const sorts = [
  { id: 'name', name: 'Alphabetical' },
  { id: 'startedAt', name: 'Created date' },
];
const statusColors = {
  error: 'bg-red-200',
  success: 'bg-green-200',
  stopped: 'bg-yellow-200',
};

const store = useStore();

const state = shallowReactive({
  query: '',
  filterBy: 'all',
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

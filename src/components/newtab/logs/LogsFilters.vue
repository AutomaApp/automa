<template>
  <div class="flex items-center mb-6 space-x-4">
    <ui-input
      id="search-input"
      :model-value="filters.query"
      :placeholder="`${t('common.search')}... (${
        shortcut['action:search'].readable
      })`"
      prepend-icon="riSearch2Line"
      class="flex-1"
      @change="updateFilters('query', $event)"
    />
    <div class="flex items-center workflow-sort">
      <ui-button
        icon
        class="rounded-r-none border-gray-300 border-r"
        @click="updateSorts('order', sorts.order === 'asc' ? 'desc' : 'asc')"
      >
        <v-remixicon
          :name="sorts.order === 'asc' ? 'riSortAsc' : 'riSortDesc'"
        />
      </ui-button>
      <ui-select
        :model-value="sorts.by"
        :placeholder="t('sort.sortBy')"
        @change="updateSorts('by', $event)"
      >
        <option v-for="sort in sortsList" :key="sort.id" :value="sort.id">
          {{ sort.name }}
        </option>
      </ui-select>
    </div>
    <ui-popover>
      <template #trigger>
        <ui-button>
          <v-remixicon name="riFilter2Line" class="mr-2 -ml-1" />
          <span>{{ t('log.filter.title') }}</span>
        </ui-button>
      </template>
      <div class="w-48">
        <p class="flex-1 mb-2 font-semibold">{{ t('log.filter.title') }}</p>
        <p class="mb-2 text-sm text-gray-600 dark:text-gray-200">
          {{ t('log.filter.byStatus') }}
        </p>
        <div class="grid grid-cols-2 gap-2">
          <ui-radio
            v-for="status in filterByStatus"
            :key="status.id"
            :model-value="filters.byStatus"
            :value="status.id"
            class="capitalize text-sm"
            @change="updateFilters('byStatus', $event)"
          >
            {{ status.name }}
          </ui-radio>
        </div>
        <p class="mb-1 text-sm text-gray-600 dark:text-gray-200 mt-3">
          {{ t('log.filter.byDate.title') }}
        </p>
        <ui-select
          :model-value="filters.byDate"
          class="w-full"
          @change="updateFilters('byDate', $event)"
        >
          <option v-for="date in filterByDate" :key="date.id" :value="date.id">
            {{ date.name }}
          </option>
        </ui-select>
      </div>
    </ui-popover>
    <ui-button
      v-tooltip:bottom="t('log.clearLogs.title')"
      icon
      @click="$emit('clear')"
    >
      <v-remixicon name="riDeleteBin7Line" />
    </ui-button>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { useShortcut } from '@/composable/shortcut';

defineProps({
  filters: {
    type: Object,
    default: () => ({}),
  },
  sorts: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['updateSorts', 'updateFilters', 'clear']);

const { t } = useI18n();
const shortcut = useShortcut('action:search', () => {
  const searchInput = document.querySelector('#search-input input');

  searchInput?.focus();
});

const filterByStatus = [
  { id: 'all', name: t('common.all') },
  { id: 'success', name: t('logStatus.success') },
  { id: 'stopped', name: t('logStatus.stopped') },
  { id: 'error', name: t('logStatus.error') },
];
const filterByDate = [
  { id: 0, name: t('common.all') },
  { id: 1, name: t('log.filter.byDate.items.lastDay') },
  { id: 7, name: t('log.filter.byDate.items.last7Days') },
  { id: 30, name: t('log.filter.byDate.items.last30Days') },
];
const sortsList = [
  { id: 'name', name: t('sort.name') },
  { id: 'startedAt', name: t('sort.createdAt') },
];

function updateFilters(key, value) {
  emit('updateFilters', { key, value });
}
function updateSorts(key, value) {
  emit('updateSorts', { key, value });
}
</script>

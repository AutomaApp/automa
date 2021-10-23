<template>
  <div class="flex items-center mb-6 space-x-4">
    <ui-input
      :model-value="filters.query"
      prepend-icon="riSearch2Line"
      placeholder="Search..."
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
        placeholder="Sort by"
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
          <span>Filters</span>
        </ui-button>
      </template>
      <div class="w-48">
        <p class="flex-1 mb-2 font-semibold">Filters</p>
        <p class="mb-2 text-sm text-gray-600">By status</p>
        <div class="grid grid-cols-2 gap-2">
          <ui-radio
            v-for="status in filterByStatus"
            :key="status"
            :model-value="filters.byStatus"
            :value="status"
            class="capitalize text-sm"
            @change="updateFilters('byStatus', $event)"
          >
            {{ status }}
          </ui-radio>
        </div>
        <p class="mb-1 text-sm text-gray-600 mt-3">By date</p>
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
  </div>
</template>
<script setup>
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
const emit = defineEmits(['updateSorts', 'updateFilters']);

const filterByStatus = ['all', 'success', 'stopped', 'error'];
const filterByDate = [
  { id: 0, name: 'All' },
  { id: 1, name: 'Last day' },
  { id: 7, name: 'Last 7 days' },
  { id: 30, name: 'Last 30 days' },
];
const sortsList = [
  { id: 'name', name: 'Name' },
  { id: 'startedAt', name: 'Created date' },
];

function updateFilters(key, value) {
  emit('updateFilters', { key, value });
}
function updateSorts(key, value) {
  emit('updateSorts', { key, value });
}
</script>

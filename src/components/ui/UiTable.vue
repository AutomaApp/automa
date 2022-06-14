<template>
  <table class="custom-table">
    <thead>
      <tr>
        <th
          v-for="header in table.headers"
          :key="header.value"
          :align="header.align"
          class="relative"
          v-bind="header.attrs"
        >
          <span
            :class="{ 'cursor-pointer': header.sortable }"
            class="inline-block"
            @click="updateSort(header)"
          >
            {{ header.text }}
          </span>
          <span
            v-if="header.sortable"
            class="cursor-pointer ml-1 sort-icon"
            @click="updateSort(header)"
          >
            <v-remixicon
              v-if="sortState.id === header.value"
              :rotate="sortState.order === 'asc' ? 90 : -90"
              class="transition-transform"
              size="20"
              name="riArrowLeftLine"
            />
            <v-remixicon v-else name="riArrowUpDownLine" size="20" />
          </span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in sortedItems" :key="item[itemKey]">
        <slot name="item-prepend" :item="item" />
        <td
          v-for="header in headers"
          v-bind="header.rowAttrs"
          :key="header.value"
          :align="header.align"
        >
          <slot :name="`item-${header.value}`">
            {{ item[header.value] }}
          </slot>
        </td>
        <slot name="item-append" :item="item" />
      </tr>
    </tbody>
  </table>
</template>
<script setup>
import { reactive, computed, watch } from 'vue';
import { isObject } from '@/utils/helper';

const props = defineProps({
  headers: {
    type: Array,
    default: () => [],
  },
  items: {
    type: Array,
    default: () => [],
  },
  itemKey: {
    type: String,
    default: '',
    required: true,
  },
  search: {
    type: String,
    default: '',
  },
  customFilter: {
    type: Function,
    default: null,
  },
});

const table = reactive({
  headers: [],
  filterKeys: [],
});
const sortState = reactive({
  id: '',
  order: 'asc',
});

const filteredItems = computed(() => {
  const filterFunc =
    props.customFilter ||
    ((search, item) => {
      return table.filterKeys.every((key) =>
        item[key].toLocaleLowerCase().includes(search)
      );
    });

  const search = props.search.toLocaleLowerCase();
  return props.items.filter((item, index) => filterFunc(search, item, index));
});
const sortedItems = computed(() => {
  if (sortState.id === '') return filteredItems.value;

  return filteredItems.value.slice().sort((a, b) => {
    let comparison = 0;
    const itemA = a[sortState.id];
    const itemB = b[sortState.id];

    if (itemA > itemB) {
      comparison = 1;
    } else if (itemA < itemB) {
      comparison = -1;
    }

    return sortState.order === 'desc' ? comparison * -1 : comparison;
  });
});

function updateSort({ sortable, value }) {
  if (!sortable) return;

  if (sortState.id !== value) {
    sortState.id = value;
    sortState.order = 'asc';
    return;
  }

  if (sortState.order === 'asc') {
    sortState.order = 'desc';
  } else {
    sortState.id = '';
  }
}

watch(
  () => props.headers,
  (newHeaders) => {
    const filterKeys = new Set();

    table.headers = newHeaders.map((header) => {
      const headerObj = {
        attrs: {},
        rowAttrs: {},
        align: 'left',
        text: header,
        value: header,
        sortable: true,
        filterable: false,
      };

      if (isObject(header)) Object.assign(headerObj, header);
      if (headerObj.filterable) filterKeys.add(headerObj.value);

      return headerObj;
    });

    table.filterKeys = Array.from(filterKeys);
  },
  { immediate: true }
);
</script>
<style>
.sort-icon svg {
  @apply text-gray-600 dark:text-gray-300 inline-block;
}
</style>

<template>
  <div class="flex mb-4">
    <ui-input
      v-model.lowercase="state.query"
      autofocus
      placeholder="Search or add column"
      class="mr-2 flex-1"
      @keyup.enter="addColumn"
      @keyup.esc="$emit('close')"
    />
    <ui-button variant="accent" @click="addColumn">Add</ui-button>
  </div>
  <ul
    class="space-y-2 overflow-y-auto scroll py-1"
    style="max-height: calc(100vh - 10rem)"
  >
    <li
      v-for="(column, index) in columns"
      :key="column.name"
      class="flex items-center space-x-2"
    >
      <ui-input v-model="columns[index].name" placeholder="Column name" />
      <ui-input v-model="columns[index].default" placeholder="Default value" />
      <button @click="state.columns.splice(index, 1)">
        <v-remixicon name="riDeleteBin7Line" />
      </button>
    </li>
  </ul>
</template>
<script setup>
import { computed, onMounted, watch, reactive } from 'vue';
import { debounce } from '@/utils/helper';

const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update', 'close']);

const state = reactive({
  query: '',
  columns: [],
});
const columns = computed(() =>
  state.columns.filter(({ name }) => name.includes(state.query))
);

function addColumn() {
  const isColumnExists = state.columns.some(({ name }) => name === state.query);

  if (isColumnExists || state.query.trim() === '') return;

  state.columns.push({ name: state.query, default: '' });
  state.query = '';
}

watch(
  () => state.columns,
  debounce((newValue) => {
    emit('update', { dataColumns: newValue });
  }, 250),
  { deep: true }
);

onMounted(() => {
  const tempColumns = props.workflow.dataColumns;

  state.columns = Array.isArray(tempColumns)
    ? tempColumns
    : Object.values(tempColumns);
});
</script>

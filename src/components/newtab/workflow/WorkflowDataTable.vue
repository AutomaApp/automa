<template>
  <div class="flex mb-4">
    <ui-input
      v-model="state.query"
      autofocus
      :placeholder="t('workflow.table.placeholder')"
      class="mr-2 flex-1"
      @keyup.enter="addColumn"
      @keyup.esc="$emit('close')"
    />
    <ui-button variant="accent" @click="addColumn">
      {{ t('common.add') }}
    </ui-button>
  </div>
  <div
    class="overflow-y-auto scroll"
    style="max-height: 600px; height: calc(100vh - 13rem)"
  >
    <p v-if="columns.length === 0" class="text-center mt-4">
      {{ t('message.noData') }}
    </p>
    <ul v-else class="space-y-2 py-1">
      <li
        v-for="(column, index) in columns"
        :key="column.id"
        class="flex items-center space-x-2"
      >
        <ui-input
          :model-value="columns[index].name"
          :placeholder="t('workflow.table.column.name')"
          class="flex-1"
          @blur="updateColumnName(index, $event.target)"
        />
        <ui-select
          v-model="columns[index].type"
          class="flex-1"
          :placeholder="t('workflow.table.column.type')"
        >
          <option v-for="type in dataTypes" :key="type.id" :value="type.id">
            {{ type.name }}
          </option>
        </ui-select>
        <button @click="state.columns.splice(index, 1)">
          <v-remixicon name="riDeleteBin7Line" />
        </button>
      </li>
    </ul>
  </div>
</template>
<script setup>
import { computed, onMounted, watch, reactive } from 'vue';
import { nanoid } from 'nanoid';
import { useI18n } from 'vue-i18n';
import { debounce } from '@/utils/helper';

const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update', 'close', 'change']);

const { t } = useI18n();

const dataTypes = [
  { id: 'any', name: 'Any' },
  { id: 'string', name: 'Text' },
  { id: 'integer', name: 'Number' },
  { id: 'boolean', name: 'Boolean' },
  { id: 'array', name: 'Array' },
];

const state = reactive({
  query: '',
  columns: [],
});
const columns = computed(() =>
  state.columns.filter(({ name }) => name.includes(state.query))
);

function getColumnName(name) {
  const columnName = name.replace(/[\s@[\]]/g, '');
  const isColumnExists = state.columns.some(
    (column) => column.name === columnName
  );

  if (isColumnExists || columnName.trim() === '') return '';

  return columnName;
}
function updateColumnName(index, target) {
  const columnName = getColumnName(target.value);

  if (!columnName) {
    target.value = state.columns[index].name;
    return;
  }

  state.columns[index].name = columnName;
}
function addColumn() {
  const columnName = getColumnName(state.query);

  if (!columnName) return;

  state.columns.push({ id: nanoid(5), name: columnName, type: 'string' });
  state.query = '';
}

watch(
  () => state.columns,
  debounce((newValue) => {
    const data = { table: newValue };

    emit('update', data);
    emit('change', data);
  }, 250),
  { deep: true }
);

onMounted(() => {
  let isChanged = false;
  state.columns =
    props.workflow.table?.map((column) => {
      if (!column.id) {
        isChanged = true;
        column.id = column.name;
      }

      return column;
    }) || [];

  if (isChanged) {
    const data = { table: state.columns };

    emit('change', data);
    emit('update', data);
  }
});
</script>

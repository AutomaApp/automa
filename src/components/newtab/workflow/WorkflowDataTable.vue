<template>
  <template v-if="!workflow.connectedTable">
    <ui-popover class="mb-4">
      <template #trigger>
        <ui-button> Connect to a storage table </ui-button>
      </template>
      <p>Select a table</p>
      <ui-list class="mt-2 space-y-1 max-h-80 overflow-auto w-64">
        <p v-if="state.tableList.length === 0">
          {{ t('message.noData') }}
        </p>
        <ui-list-item
          v-for="item in state.tableList"
          :key="item.id"
          class="text-overflow cursor-pointer"
          @click="connectTable(item)"
        >
          {{ item.name }}
        </ui-list-item>
      </ui-list>
    </ui-popover>
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
  </template>
  <div
    v-else-if="state.connectedTable"
    class="py-2 px-4 rounded-md bg-green-200 dark:bg-green-300 flex items-center mb-4"
  >
    <p class="mr-1 text-black">
      This workflow is connected to the
      <router-link
        :to="`/storage/tables/${state.connectedTable.id}`"
        class="underline"
      >
        {{ state.connectedTable.name }}
      </router-link>
      table
    </p>
    <v-remixicon
      name="riLinkUnlinkM"
      title="Disconnect table"
      class="cursor-pointer"
      @click="disconnectTable"
    />
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
          :disabled="Boolean(workflow.connectedTable)"
          :model-value="columns[index].name"
          :placeholder="t('workflow.table.column.name')"
          class="flex-1"
          @blur="updateColumnName(index, $event.target)"
        />
        <ui-select
          v-model="columns[index].type"
          :disabled="Boolean(workflow.connectedTable)"
          :placeholder="t('workflow.table.column.type')"
          class="flex-1"
        >
          <option v-for="type in dataTypes" :key="type.id" :value="type.id">
            {{ type.name }}
          </option>
        </ui-select>
        <button
          v-if="!Boolean(workflow.connectedTable)"
          @click="state.columns.splice(index, 1)"
        >
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
import dbStorage from '@/db/storage';
import { debounce } from '@/utils/helper';
import { dataTypes } from '@/utils/constants/table';
import { useWorkflowStore } from '@/stores/workflow';

const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits([
  'update',
  'close',
  'change',
  'connect',
  'disconnect',
]);

const { t } = useI18n();
const workflowStore = useWorkflowStore();

const state = reactive({
  query: '',
  columns: [],
  tableList: [],
  connectedTable: null,
});
const columns = computed(() => {
  if (state.connectedTable) return state.connectedTable.columns;

  return state.columns.filter(({ name }) => name.includes(state.query));
});

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
function connectTable(table) {
  workflowStore
    .update({
      id: props.workflow.id,
      data: { connectedTable: table.id },
    })
    .then(() => {
      emit('connect');
      state.query = '';
      state.connectedTable = table;
    });
}
function disconnectTable() {
  workflowStore
    .update({
      id: props.workflow.id,
      data: { connectedTable: null },
    })
    .then(() => {
      state.columns = props.workflow.table;
      state.connectedTable = null;
      emit('disconnect');
    });
}

watch(
  () => state.columns,
  debounce((newValue) => {
    if (props.workflow.connectedTable) return;

    const data = { table: newValue };

    emit('update', data);
    emit('change', data);
  }, 250),
  { deep: true }
);

onMounted(async () => {
  state.tableList = await dbStorage.tablesItems.toArray();
  if (props.workflow.connectedTable) {
    const findTable = state.tableList.find(
      (table) => table.id === props.workflow.connectedTable
    );

    if (findTable) {
      state.connectedTable = findTable;
      return;
    }
    emit('change', { connectedTable: null });
    emit('update', { connectedTable: null });
  }

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

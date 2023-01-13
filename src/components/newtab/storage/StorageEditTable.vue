<template>
  <ui-modal :model-value="modelValue" persist custom-content>
    <ui-card
      padding="p-0"
      class="flex w-full max-w-xl flex-col"
      style="height: 600px"
    >
      <p class="p-4 font-semibold">
        {{ t('storage.table.add') }}
      </p>
      <div class="scroll flex-1 overflow-auto px-4 pb-4">
        <ui-input
          v-model="state.name"
          class="-mt-1 w-full"
          label="Table name"
          placeholder="My table"
        />
        <div class="mt-4 flex items-center">
          <p class="flex-1">Columns</p>
          <ui-button icon :title="t('common.add')" @click="addColumn">
            <v-remixicon name="riAddLine" />
          </ui-button>
        </div>
        <p
          v-if="state.columns && state.columns.length === 0"
          class="my-4 text-center text-gray-600 dark:text-gray-300"
        >
          {{ t('message.noData') }}
        </p>
        <ul class="mt-4 space-y-2">
          <li
            v-for="(column, index) in state.columns"
            :key="column.id"
            class="flex items-center space-x-2"
          >
            <ui-input
              :model-value="column.name"
              :placeholder="t('workflow.table.column.name')"
              class="flex-1"
              @blur="updateColumnName(index, $event.target)"
            />
            <ui-select
              v-model="column.type"
              class="flex-1"
              :placeholder="t('workflow.table.column.type')"
            >
              <option v-for="type in dataTypes" :key="type.id" :value="type.id">
                {{ type.name }}
              </option>
            </ui-select>
            <button @click="deleteColumn(index)">
              <v-remixicon name="riDeleteBin7Line" />
            </button>
          </li>
        </ul>
      </div>
      <div class="p-4 text-right">
        <ui-button class="mr-4" @click="clearTempTables(true)">
          {{ t('common.cancel') }}
        </ui-button>
        <ui-button
          :disabled="!state.name || state.columns.length === 0"
          variant="accent"
          @click="saveTable"
        >
          {{ t('common.save') }}
        </ui-button>
      </div>
    </ui-card>
  </ui-modal>
</template>
<script setup>
import { reactive, toRaw, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { nanoid } from 'nanoid';
import cloneDeep from 'lodash.clonedeep';
import { dataTypes } from '@/utils/constants/table';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    default: '',
  },
  columns: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['update:modelValue', 'save']);

const { t } = useI18n();

let changes = {};
const state = reactive({
  name: '',
  columns: [],
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
  const { id, name } = state.columns[index];
  if (!columnName) {
    target.value = name;
    return;
  }

  changes[id] = { type: 'rename', id, oldValue: name, newValue: columnName };
  state.columns[index].name = columnName;
}
function saveTable() {
  const rawState = toRaw(state);

  emit('save', { ...rawState, changes });
}
function addColumn() {
  const columnId = nanoid(5);
  const columnName = `column_${columnId}`;

  changes[columnId] = {
    type: 'add',
    id: columnId,
    name: columnName,
  };

  state.columns.push({
    id: columnId,
    type: 'string',
    name: columnName,
  });
}
function clearTempTables(close = false) {
  state.name = '';
  state.columns = [];
  changes = {};

  if (close) {
    emit('update:modelValue', false);
  }
}
function deleteColumn(index) {
  const column = state.columns[index];
  changes[column.id] = { type: 'delete', id: column.id, name: column.name };

  state.columns.splice(index, 1);
}

watch(
  () => props.modelValue,
  () => {
    if (props.modelValue) {
      Object.assign(state, {
        name: `${props.name}`,
        columns: cloneDeep(props.columns),
      });
    } else {
      clearTempTables();
    }
  }
);
</script>

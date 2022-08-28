<template>
  <div v-if="tableDetail && tableData" class="container py-8 pb-4">
    <div class="mb-12 flex items-center">
      <h1 class="font-semibold text-3xl">
        {{ tableDetail.name }}
      </h1>
      <div class="flex-grow"></div>
      <ui-button
        v-tooltip.group="'Clear data'"
        icon
        class="ml-2"
        @click="clearData"
      >
        <v-remixicon name="riFileShredLine" />
      </ui-button>
      <ui-button
        v-tooltip="'Delete table'"
        icon
        class="text-red-400 dark:text-red-300 ml-4"
        @click="deleteTable"
      >
        <v-remixicon name="riDeleteBin7Line" />
      </ui-button>
    </div>
    <div class="flex items-center mb-4">
      <ui-input
        v-model="state.query"
        :placeholder="t('common.search')"
        prepend-icon="riSearch2Line"
      />
      <div class="flex-grow" />
      <div class="flex-1"></div>
      <ui-button class="ml-4" @click="editTable">
        <v-remixicon name="riPencilLine" class="mr-2 -ml-1" />
        <span>Edit table</span>
      </ui-button>
      <ui-popover trigger-width class="ml-4">
        <template #trigger>
          <ui-button variant="accent">
            <span>{{ t('log.exportData.title') }}</span>
            <v-remixicon name="riArrowDropDownLine" class="ml-2 -mr-1" />
          </ui-button>
        </template>
        <ui-list class="space-y-1">
          <ui-list-item
            v-for="type in dataExportTypes"
            :key="type.id"
            v-close-popover
            class="cursor-pointer"
            @click="exportData(type.id)"
          >
            {{ t(`log.exportData.types.${type.id}`) }}
          </ui-list-item>
        </ui-list>
      </ui-popover>
    </div>
    <ui-table
      :headers="table.header"
      :items="rows"
      :search="state.query"
      item-key="id"
      class="w-full"
    >
      <template #item-action="{ item }">
        <v-remixicon
          title="Delete row"
          class="cursor-pointer"
          name="riDeleteBin7Line"
          @click="deleteRow(item)"
        />
      </template>
    </ui-table>
    <div
      v-if="table.body && table.body.length >= 10"
      class="flex items-center justify-between mt-4"
    >
      <div>
        {{ t('components.pagination.text1') }}
        <select v-model="pagination.perPage" class="p-1 rounded-md bg-input">
          <option
            v-for="num in [10, 15, 25, 50, 100, 150]"
            :key="num"
            :value="num"
          >
            {{ num }}
          </option>
        </select>
        {{
          t('components.pagination.text2', {
            count: table.body.length,
          })
        }}
      </div>
      <ui-pagination
        v-model="pagination.currentPage"
        :per-page="pagination.perPage"
        :records="table.body.length"
      />
    </div>
    <storage-edit-table
      v-model="editState.show"
      :name="editState.name"
      :columns="editState.columns"
      @save="saveEditedTable"
    />
  </div>
</template>
<script setup>
import {
  watch,
  shallowRef,
  shallowReactive,
  computed,
  toRaw,
  triggerRef,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useWorkflowStore } from '@/stores/workflow';
import { useLiveQuery } from '@/composable/liveQuery';
import { useDialog } from '@/composable/dialog';
import { objectHasKey } from '@/utils/helper';
import { dataExportTypes } from '@/utils/shared';
import StorageEditTable from '@/components/newtab/storage/StorageEditTable.vue';
import dbStorage from '@/db/storage';
import dataExporter from '@/utils/dataExporter';

const { t } = useI18n();
const route = useRoute();
const dialog = useDialog();
const router = useRouter();
const workflowStore = useWorkflowStore();

const tableId = +route.params.id;

const tableDetail = useLiveQuery(() =>
  dbStorage.tablesItems.where('id').equals(tableId).first()
);
const tableData = useLiveQuery(() =>
  dbStorage.tablesData.where('tableId').equals(tableId).first()
);

const table = shallowRef({
  body: [],
  header: [],
});
const state = shallowReactive({
  query: '',
});
const editState = shallowReactive({
  name: '',
  columns: [],
  show: false,
});
const pagination = shallowReactive({
  perPage: 10,
  currentPage: 1,
});

const rows = computed(() =>
  table.value.body.slice(
    (pagination.currentPage - 1) * pagination.perPage,
    pagination.currentPage * pagination.perPage
  )
);

function editTable() {
  editState.name = tableDetail.value.name;
  editState.columns = tableDetail.value.columns;
  editState.show = true;
}
function additionalHeaders(headers) {
  headers.unshift({ value: '$$id', text: '', sortable: false });
  headers.push({
    value: 'action',
    text: '',
    sortable: false,
    align: 'right',
    attrs: {
      width: '100px',
    },
  });

  return headers;
}
function exportData(type) {
  dataExporter(
    tableData.value.items,
    { name: tableDetail.value.name, type },
    true
  );
}
async function saveEditedTable({ columns, name, changes }) {
  const columnsChanges = Object.values(changes);

  try {
    await dbStorage.tablesItems.update(tableId, {
      name,
      columns,
    });

    const headers = [];
    const newTableData = [];
    const newColumnsIndex = {};
    const { columnsIndex } = tableData.value;

    columns.forEach(({ name: columnName, id, type }) => {
      const index = columnsIndex[id]?.index || 0;

      newColumnsIndex[id] = {
        type,
        index,
        name: columnName,
      };
      headers.push({
        text: columnName,
        value: columnName,
        filterable: ['string', 'any'].includes(type),
      });
    });

    if (columnsIndex.column) {
      newColumnsIndex.column = toRaw(columnsIndex.column);
    }

    table.value.header = additionalHeaders(headers);
    table.value.body = table.value.body.map((item, index) => {
      columnsChanges.forEach(
        ({ type, oldValue, newValue, name: columnName }) => {
          if (type === 'rename' && objectHasKey(item, oldValue)) {
            item[newValue] = item[oldValue];

            delete item[oldValue];
          } else if (type === 'delete') {
            delete item[columnName];
          }
        }
      );

      delete item.$$id;
      newTableData.push({ ...item });
      item.$$id = index + 1;

      return item;
    });

    await dbStorage.tablesData.where('tableId').equals(tableId).modify({
      items: newTableData,
      columnsIndex: newColumnsIndex,
    });

    editState.show = false;
  } catch (error) {
    console.error(error);
  }
}
function deleteRow(item) {
  const rowIndex = table.value.body.findIndex(({ $$id }) => $$id === item.$$id);
  if (rowIndex === -1) return;

  const cache = {};
  const { columnsIndex } = tableData.value;
  const columns = Object.values(tableDetail.value.columns);

  Object.keys(item).forEach((key) => {
    if (key === '$$id') return;

    const column =
      cache[key] || columns.find((currColumn) => currColumn.name === key);
    if (!column) return;

    const columnIndex = columnsIndex[column.id];
    if (columnIndex && columnIndex.index >= item.$$id - 1) {
      columnIndex.index -= 1;
    }

    cache[key] = column;
  });

  table.value.body.splice(rowIndex, 1);
  tableData.value.items.splice(rowIndex, 1);

  dbStorage.tablesItems.update(tableId, {
    modifiedAt: Date.now(),
    rowsCount: tableDetail.value.rowsCount - 1,
  });
  dbStorage.tablesData
    .where('tableId')
    .equals(tableId)
    .modify({
      items: toRaw(tableData.value.items),
      columnsIndex: toRaw(columnsIndex),
    })
    .then(() => {
      triggerRef(table);
    });
}
function clearData() {
  dialog.confirm({
    title: 'Clear data',
    okVariant: 'danger',
    body: 'Are you sure want to clear the table data?',
    onConfirm: async () => {
      await dbStorage.tablesItems.update(tableId, {
        rowsCount: 0,
        modifiedAt: Date.now(),
      });

      const columnsIndex = tableDetail.value.columns.reduce(
        (acc, column) => {
          acc[column.id] = {
            index: 0,
            type: column.type,
            name: column.name,
          };

          return acc;
        },
        { column: { index: 0, type: 'any', name: 'column' } }
      );
      await dbStorage.tablesData.where('tableId').equals(tableId).modify({
        items: [],
        columnsIndex,
      });
    },
  });
}
function deleteTable() {
  dialog.confirm({
    title: t('storage.table.delete'),
    okVariant: 'danger',
    body: t('message.delete', { name: tableDetail.value.name }),
    onConfirm: async () => {
      try {
        await dbStorage.tablesItems.where('id').equals(tableId).delete();
        await dbStorage.tablesData.where('tableId').equals(tableId).delete();

        await workflowStore.update({
          id: (workflow) => workflow.connectedTable === tableId,
          data: { connectedTable: null },
        });

        router.replace('/storage');
      } catch (error) {
        console.error(error);
      }
    },
  });
}

watch(tableData, () => {
  if (!tableDetail.value || !tableData.value) return;

  const dataTable = { header: [], body: [] };
  const headers = tableDetail.value.columns.map(({ name, type }) => ({
    text: name,
    value: name,
    filterable: ['string', 'any'].includes(type),
  }));

  dataTable.body = tableData.value.items.map((item, index) => ({
    ...item,
    $$id: index + 1,
  }));
  dataTable.header = additionalHeaders(headers);

  table.value = dataTable;
});
</script>

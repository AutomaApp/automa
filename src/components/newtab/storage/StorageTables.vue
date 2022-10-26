<template>
  <div class="flex mt-6">
    <ui-input
      v-model="state.query"
      :placeholder="t('common.search')"
      prepend-icon="riSearch2Line"
    />
    <div class="flex-grow"></div>
    <ui-button
      variant="accent"
      class="ml-4"
      style="min-width: 120px"
      @click="state.showAddTable = true"
    >
      {{ t('storage.table.add') }}
    </ui-button>
  </div>
  <div class="overflow-x-auto w-full scroll">
    <ui-table
      item-key="id"
      :headers="tableHeaders"
      :items="items"
      :search="state.query"
      class="w-full mt-4"
    >
      <template #item-name="{ item }">
        <router-link
          :to="`/storage/tables/${item.id}`"
          class="w-full block"
          style="min-height: 29px"
        >
          {{ item.name }}
        </router-link>
      </template>
      <template #item-createdAt="{ item }">
        {{ formatDate(item.createdAt) }}
      </template>
      <template #item-modifiedAt="{ item }">
        {{ formatDate(item.modifiedAt) }}
      </template>
      <template #item-actions="{ item }">
        <v-remixicon
          name="riDeleteBin7Line"
          class="cursor-pointer"
          @click="deleteTable(item)"
        />
      </template>
    </ui-table>
  </div>
  <storage-edit-table v-model="state.showAddTable" @save="saveTable" />
</template>
<script setup>
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import { useDialog } from '@/composable/dialog';
import { useWorkflowStore } from '@/stores/workflow';
import { useLiveQuery } from '@/composable/liveQuery';
import dbStorage from '@/db/storage';
import StorageEditTable from './StorageEditTable.vue';

const { t } = useI18n();
const dialog = useDialog();
const workflowStore = useWorkflowStore();

const state = reactive({
  query: '',
  showAddTable: false,
});

const tableHeaders = [
  {
    value: 'name',
    filterable: true,
    text: t('common.name'),
    attrs: {
      class: 'w-4/12',
      style: 'min-width: 120px',
    },
  },
  {
    align: 'center',
    value: 'createdAt',
    text: t('storage.table.createdAt'),
    attrs: {
      style: 'min-width: 200px',
    },
  },
  {
    align: 'center',
    value: 'modifiedAt',
    text: t('storage.table.modifiedAt'),
    attrs: {
      style: 'min-width: 200px',
    },
  },
  {
    value: 'rowsCount',
    align: 'center',
    text: t('storage.table.rowsCount'),
  },
  {
    value: 'actions',
    align: 'right',
    text: '',
    sortable: false,
  },
];
const items = useLiveQuery(() => dbStorage.tablesItems.reverse().toArray());

function formatDate(date) {
  return dayjs(date).format('DD MMM YYYY, hh:mm:ss A');
}
async function saveTable({ columns, name }) {
  try {
    const columnsIndex = columns.reduce(
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

    const tableId = await dbStorage.tablesItems.add({
      rowsCount: 0,
      name,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      columns,
    });
    await dbStorage.tablesData.add({
      tableId,
      items: [],
      columnsIndex,
    });

    state.showAddTable = false;
  } catch (error) {
    console.error(error);
  }
}
function deleteTable(table) {
  dialog.confirm({
    title: t('storage.table.delete'),
    okVariant: 'danger',
    body: t('message.delete', { name: table.name }),
    onConfirm: async () => {
      try {
        await dbStorage.tablesItems.where('id').equals(table.id).delete();
        await dbStorage.tablesData.where('tableId').equals(table.id).delete();

        await workflowStore.update({
          id: (workflow) => workflow.connectedTable === table.id,
          data: { connectedTable: null },
        });
      } catch (error) {
        console.error(error);
      }
    },
  });
}
</script>

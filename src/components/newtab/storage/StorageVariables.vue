<template>
  <div class="flex mt-6">
    <ui-input
      v-model="state.query"
      :placeholder="t('common.search')"
      prepend-icon="riSearch2Line"
    />
    <div class="flex-grow"></div>
    <ui-button variant="accent" @click="editState.show = true">
      Add variable
    </ui-button>
  </div>
  <ui-table
    item-key="id"
    :headers="tableHeaders"
    :items="variables"
    :search="state.query"
    class="w-full mt-4"
  >
    <template #item-actions="{ item }">
      <v-remixicon
        name="riPencilLine"
        class="cursor-pointer inline-block mr-4"
        @click="editVariable(item)"
      />
      <v-remixicon
        name="riDeleteBin7Line"
        class="cursor-pointer inline-block"
        @click="deleteVariable(item)"
      />
    </template>
  </ui-table>
  <ui-modal
    v-model="editState.show"
    :title="`${editState.type === 'edit' ? 'Edit' : 'Add'} variable`"
  >
    <ui-input v-model="editState.name" placeholder="Name" class="w-full" />
    <ui-textarea
      v-model="editState.value"
      placeholder="value"
      class="w-full mt-4"
    />
    <div class="text-right mt-8">
      <ui-button class="mr-4" @click="editState.show = false">
        {{ t('common.cancel') }}
      </ui-button>
      <ui-button
        :disabled="!editState.name || editState.disabled"
        variant="accent"
        @click="saveVariable"
      >
        {{ t('common.save') }}
      </ui-button>
    </div>
  </ui-modal>
</template>
<script setup>
import { shallowReactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { parseJSON } from '@/utils/helper';
import { useLiveQuery } from '@/composable/liveQuery';
import dbStorage from '@/db/storage';

const { t } = useI18n();
const toast = useToast();
const variables = useLiveQuery(() => dbStorage.variables.toArray());

const tableHeaders = [
  {
    value: 'name',
    filterable: true,
    text: t('common.name'),
    attrs: {
      class: 'w-3/12 text-overflow',
    },
  },
  {
    value: 'value',
    filterable: false,
    text: 'Value',
    attrs: {
      class: 'flex-1 line-clamp',
    },
  },
  {
    value: 'actions',
    filterable: false,
    sortable: false,
    text: '',
    attrs: {
      class: 'w-24',
    },
  },
];

const state = shallowReactive({
  id: '',
  query: '',
});
const editState = shallowReactive({
  type: '',
  name: '',
  value: '',
  show: false,
});

function deleteVariable({ id }) {
  dbStorage.variables.delete(id);
}
function editVariable({ id, name, value }) {
  state.id = id;
  editState.name = name;
  editState.value = value;
  editState.type = 'edit';
  editState.show = true;
}
function saveVariable() {
  if (!editState.name) return;

  const trimmedName = editState.name.trim();
  const duplicateName = variables.value.some(
    ({ name, id }) => name.trim() === trimmedName && id !== state.id
  );

  if (duplicateName) {
    toast.error(`You alread add "${trimmedName}" variable`);
    return;
  }

  const varValue = parseJSON(editState.value, editState.value);

  if (editState.type === 'edit') {
    dbStorage.variables
      .update(state.id, {
        value: varValue,
        name: trimmedName,
      })
      .then(() => {
        editState.show = false;
      });
  } else {
    dbStorage.variables
      .add({
        value: varValue,
        name: trimmedName,
      })
      .then(() => {
        editState.show = false;
      });
  }
}

watch(
  () => editState.show,
  (value) => {
    if (value) return;

    state.id = '';
    Object.assign(editState, {
      name: '',
      type: '',
      value: '',
      show: false,
    });
  }
);
</script>

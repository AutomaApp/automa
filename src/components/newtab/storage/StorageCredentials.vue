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
      style="min-width: 120px"
      class="ml-4"
      @click="addState.show = true"
    >
      {{ t('credential.add') }}
    </ui-button>
  </div>
  <ui-table
    item-key="id"
    :headers="tableHeaders"
    :items="credentials"
    :search="state.query"
    class="w-full mt-4"
  >
    <template #item-value> ************ </template>
    <template #item-createdAt="{ item }">
      {{ dayjs(item.createdAt).format('DD MMMM YYYY, hh:mm A') }}
    </template>
    <template #item-actions="{ item }">
      <v-remixicon
        name="riDeleteBin7Line"
        class="cursor-pointer inline-block"
        @click="deleteCredential(item)"
      />
    </template>
  </ui-table>
  <ui-modal v-model="addState.show" :title="t('credential.add')">
    <ui-input v-model="addState.name" placeholder="Name" class="w-full" />
    <ui-textarea
      v-model="addState.value"
      placeholder="value"
      class="w-full mt-4"
    />
    <div class="text-right mt-8">
      <ui-button class="mr-4" @click="addState.show = false">
        {{ t('common.cancel') }}
      </ui-button>
      <ui-button
        :disabled="!addState.name"
        variant="accent"
        @click="saveCredential"
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
import dayjs from 'dayjs';
import credentialUtil from '@/utils/credentialUtil';
import { useLiveQuery } from '@/composable/liveQuery';
import dbStorage from '@/db/storage';

const { t } = useI18n();
const toast = useToast();
const credentials = useLiveQuery(() => dbStorage.credentials.toArray());

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
    sortable: false,
    filterable: false,
    text: 'Value',
  },
  {
    value: 'createdAt',
    filterable: false,
    text: 'Created date',
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
const addState = shallowReactive({
  type: '',
  name: '',
  value: '',
  show: false,
});

function deleteCredential({ id }) {
  dbStorage.credentials.delete(id);
}
function saveCredential() {
  if (!addState.name) return;

  const trimmedName = addState.name.trim();
  const duplicateName = credentials.value.some(
    ({ name, id }) => name.trim() === trimmedName && id !== state.id
  );

  if (duplicateName) {
    toast.error(`You alread add "${trimmedName}" credential`);
    return;
  }

  const encryptedValue = credentialUtil.encrypt(addState.value);

  dbStorage.credentials
    .add({
      name: trimmedName,
      createdAt: Date.now(),
      value: encryptedValue,
    })
    .then(() => {
      addState.show = false;
    });
}

watch(
  () => addState.show,
  (value) => {
    if (value) return;

    state.id = '';
    Object.assign(addState, {
      name: '',
      type: '',
      value: '',
      show: false,
    });
  }
);
</script>

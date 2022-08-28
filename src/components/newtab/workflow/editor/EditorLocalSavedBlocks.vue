<template>
  <div class="p-4 absolute w-full bottom-0 z-50">
    <ui-card class="w-full h-full" padding="p-0">
      <div class="flex items-center p-4">
        <ui-input
          v-model="state.query"
          :placeholder="$t('common.search')"
          autofocus
          autocomplete="off"
          prepend-icon="riSearch2Line"
        />
        <ui-button
          v-tooltip="'Refresh data'"
          icon
          class="ml-4"
          @click="loadData"
        >
          <v-remixicon name="riRefreshLine" />
        </ui-button>
        <div class="flex-grow" />
        <ui-button icon @click="$emit('close')">
          <v-remixicon name="riCloseLine" />
        </ui-button>
      </div>
      <div
        class="flex overflow-x-auto space-x-4 mx-4 pb-4 scroll"
        style="min-height: 95px"
      >
        <p
          v-if="state.savedBlocks.length === 0"
          class="py-8 w-full text-center"
        >
          {{ t('message.noData') }}
        </p>
        <div
          v-for="item in items"
          :key="item.id"
          draggable="true"
          class="p-4 rounded-lg flex-shrink-0 border-2 cursor-move hoverable flex flex-col relative transition"
          style="width: 220px"
          @dragstart="
            $event.dataTransfer.setData('savedBlocks', JSON.stringify(item))
          "
        >
          <p class="font-semibold text-overflow leading-tight">
            {{ item.name }}
          </p>
          <p
            class="text-gray-600 dark:text-gray-200 line-clamp leading-tight flex-1"
          >
            {{ item.description }}
          </p>
          <div
            class="space-x-3 mt-2 text-gray-600 dark:text-gray-200 flex justify-end"
          >
            <v-remixicon
              name="riPencilLine"
              size="18"
              class="cursor-pointer"
              @click="initEditState(item)"
            />
            <v-remixicon
              name="riDeleteBin7Line"
              size="18"
              class="cursor-pointer"
              @click="deleteItem(item)"
            />
          </div>
        </div>
      </div>
    </ui-card>
    <ui-modal v-model="editState.show" :title="t('common.message')">
      <ui-input
        v-model="editState.name"
        :placeholder="t('common.name')"
        autofocus
        class="w-full"
        @keyup.enter="saveEdit"
      />
      <ui-textarea
        v-model="editState.description"
        :label="t('common.description')"
        placeholder="Description..."
        class="w-full mt-4"
      />
      <div class="flex items-center justify-end space-x-4 mt-6">
        <ui-button @click="clearEditState">
          {{ t('common.cancel') }}
        </ui-button>
        <ui-button variant="accent" class="w-20" @click="saveEdit">
          {{ t('common.save') }}
        </ui-button>
      </div>
    </ui-modal>
  </div>
</template>
<script setup>
import { onMounted, reactive, computed, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import browser from 'webextension-polyfill';

defineEmits(['close']);

const { t } = useI18n();

const state = reactive({
  query: '',
  savedBlocks: [],
});
const editState = reactive({
  id: '',
  name: '',
  show: false,
  description: '',
});

const items = computed(() => {
  const query = state.query.toLocaleLowerCase();

  return state.savedBlocks.filter((item) =>
    item.name.toLocaleLowerCase().includes(query)
  );
});

function initEditState(item) {
  Object.assign(editState, {
    show: true,
    id: item.id,
    name: item.name,
    description: item.description,
  });
}
function clearEditState() {
  Object.assign(editState, {
    id: '',
    name: '',
    show: false,
    description: '',
  });
}
async function saveEdit() {
  try {
    const index = state.savedBlocks.findIndex(
      (item) => item.id === editState.id
    );
    Object.assign(state.savedBlocks[index], {
      name: editState.name,
      description: editState.description,
    });

    browser.storage.local.set({
      savedBlocks: toRaw(state.savedBlocks),
    });

    clearEditState();
  } catch (error) {
    console.error(error);
  }
}
function loadData() {
  browser.storage.local.get('savedBlocks').then((storage) => {
    state.savedBlocks = storage.savedBlocks || [];
  });
}
function deleteItem({ id }) {
  const index = state.savedBlocks.findIndex((item) => item.id === id);
  if (index === -1) return;

  state.savedBlocks.splice(index, 1);
  browser.storage.local.set({
    savedBlocks: toRaw(state.savedBlocks),
  });
}

onMounted(loadData);
</script>

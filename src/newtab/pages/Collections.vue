<template>
  <div class="container pt-8 pb-4">
    <div class="flex items-center">
      <div class="flex-grow">
        <h1 class="text-2xl font-semibold">{{ t('common.collection', 2) }}</h1>
        <p class="text-gray-600 dark:text-gray-200">
          {{ t('collection.description') }}
        </p>
      </div>
      <div class="flex items-center px-4 py-2 bg-red-400 text-white rounded-lg">
        <v-remixicon name="riErrorWarningLine" class="-ml-1" />
        <p class="ml-2">This feature will be removed in the next update</p>
      </div>
    </div>
    <div class="flex items-center my-6 space-x-4">
      <ui-input
        id="search-input"
        v-model="query"
        :placeholder="`${t('common.search')}... (${
          shortcut['action:search'].readable
        })`"
        prepend-icon="riSearch2Line"
        class="flex-1"
      />
      <ui-button
        :title="shortcut['action:new'].readable"
        variant="accent"
        @click="newCollection"
      >
        {{ t('collection.new') }}
      </ui-button>
    </div>
    <div
      v-if="Collection.query().count() === 0"
      class="py-12 flex items-center"
    >
      <img src="@/assets/svg/alien.svg" class="w-96" />
      <div class="ml-4">
        <h1 class="text-2xl font-semibold max-w-md mb-6">
          {{ t('message.empty') }}
        </h1>
        <ui-button variant="accent" @click="newCollection">
          {{ t('collection.new') }}
        </ui-button>
      </div>
    </div>
    <div class="grid gap-4 grid-cols-5 2xl:grid-cols-6">
      <shared-card
        v-for="collection in collections"
        :key="collection.id"
        :data="collection"
        :menu="collectionCardMenu"
        icon="riFolderLine"
        @click="$router.push(`/collections/${$event.id}`)"
        @execute="executeCollection"
        @menuSelected="menuHandlers[$event.id]($event.data)"
      />
    </div>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { sendMessage } from '@/utils/message';
import { useDialog } from '@/composable/dialog';
import { useShortcut } from '@/composable/shortcut';
import Collection from '@/models/collection';
import SharedCard from '@/components/newtab/shared/SharedCard.vue';

const dialog = useDialog();
const { t } = useI18n();

const collectionCardMenu = [
  { id: 'rename', name: t('common.rename'), icon: 'riPencilLine' },
  { id: 'delete', name: t('common.delete'), icon: 'riDeleteBin7Line' },
];

const query = ref('');

const collections = computed(() =>
  Collection.query()
    .where(({ name }) =>
      name.toLocaleLowerCase().includes(query.value.toLocaleLowerCase())
    )
    .orderBy('createdAt', 'desc')
    .get()
);

function executeCollection(collection) {
  sendMessage('collection:execute', collection, 'background');
}
function newCollection() {
  dialog.prompt({
    title: t('collection.new'),
    placeholder: t('common.name'),
    okText: t('collection.add'),
    onConfirm: (name) => {
      Collection.insert({
        data: {
          name: name || 'Unnamed',
          createdAt: Date.now(),
        },
      });
    },
  });
}
function renameCollection({ id, name }) {
  dialog.prompt({
    title: t('collection.rename'),
    placeholder: t('common.name'),
    okText: t('common.rename'),
    inputValue: name,
    onConfirm: (newName) => {
      Collection.update({
        where: id,
        data: {
          name: newName,
        },
      });
    },
  });
}
function deleteCollection({ name, id }) {
  dialog.confirm({
    title: t('collection.delete'),
    okVariant: 'danger',
    body: t('message.delete', { name }),
    onConfirm: () => {
      Collection.delete(id);
    },
  });
}

const shortcut = useShortcut(['action:search', 'action:new'], ({ id }) => {
  if (id === 'action:search') {
    const searchInput = document.querySelector('#search-input input');
    searchInput?.focus();
  } else {
    newCollection();
  }
});

const menuHandlers = { rename: renameCollection, delete: deleteCollection };
</script>

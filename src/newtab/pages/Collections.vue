<template>
  <div class="container pt-8 pb-4">
    <h1 class="text-2xl font-semibold">Collections</h1>
    <p class="text-gray-600 dark:text-gray-200">
      Execute your workflows continuously
    </p>
    <div class="flex items-center my-6 space-x-4">
      <ui-input
        v-model="query"
        prepend-icon="riSearch2Line"
        placeholder="Search..."
        class="flex-1"
      />
      <ui-button variant="accent" @click="newCollection">
        New collection
      </ui-button>
    </div>
    <div
      v-if="Collection.query().count() === 0"
      class="py-12 flex items-center"
    >
      <img src="@/assets/svg/alien.svg" class="w-96" />
      <div class="ml-4">
        <h1 class="text-2xl font-semibold max-w-md mb-6">
          Oppss... It's looks like you don't have any collections.
        </h1>
        <ui-button variant="accent" @click="newCollection">
          New collection
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
        @menuSelected="menuHandlers[$event.name]($event.data)"
      />
    </div>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue';
import { sendMessage } from '@/utils/message';
import { useDialog } from '@/composable/dialog';
import Collection from '@/models/collection';
import SharedCard from '@/components/newtab/shared/SharedCard.vue';

const dialog = useDialog();

const collectionCardMenu = [
  { name: 'rename', icon: 'riPencilLine' },
  { name: 'delete', icon: 'riDeleteBin7Line' },
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
    title: 'New collection',
    placeholder: 'Collection name',
    okText: 'Add collection',
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
    title: 'Rename collection',
    placeholder: 'Collection name',
    okText: 'Rename',
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
    title: 'Delete collection',
    okVariant: 'danger',
    body: `Are you sure you want to delete "${name}" collection?`,
    onConfirm: () => {
      Collection.delete(id);
    },
  });
}

const menuHandlers = { rename: renameCollection, delete: deleteCollection };
</script>

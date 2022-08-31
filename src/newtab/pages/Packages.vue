<template>
  <div class="container py-8 pb-4">
    <h1 class="text-2xl font-semibold">
      {{ $t('common.packages') }}
    </h1>
    <div class="mt-8 flex items-start">
      <div class="w-60">
        <ui-button
          class="w-full"
          variant="accent"
          @click="addState.show = true"
        >
          <p>{{ t('packages.new') }}</p>
        </ui-button>
        <ui-list class="text-gray-600 dark:text-gray-200 mt-4 space-y-1">
          <ui-list-item
            v-for="cat in categories"
            :key="cat.id"
            :active="cat.id === state.activeCat"
            class="cursor-pointer"
            color="bg-box-transparent text-black dark:text-gray-100"
            @click="state.activeCat = cat.id"
          >
            {{ cat.name }}
          </ui-list-item>
        </ui-list>
      </div>
      <div class="flex-1 ml-8">
        <div class="flex items-center">
          <ui-input
            v-model="state.query"
            prepend-icon="riSearch2Line"
            :placeholder="t('common.search')"
          />
          <div class="flex-grow" />
          <div class="flex items-center workflow-sort">
            <ui-button
              icon
              class="rounded-r-none border-gray-300 dark:border-gray-700 border-r"
              @click="
                sortState.order = sortState.order === 'asc' ? 'desc' : 'asc'
              "
            >
              <v-remixicon
                :name="sortState.order === 'asc' ? 'riSortAsc' : 'riSortDesc'"
              />
            </ui-button>
            <ui-select v-model="sortState.by" :placeholder="t('sort.sortBy')">
              <option v-for="sort in sorts" :key="sort" :value="sort">
                {{ t(`sort.${sort}`) }}
              </option>
            </ui-select>
          </div>
        </div>
        <div class="mt-8 grid gap-4 grid-cols-3 2xl:grid-cols-4">
          <ui-card
            v-for="pkg in packages"
            :key="pkg.id"
            class="hover:ring-2 flex flex-col group hover:ring-accent dark:hover:ring-gray-200"
          >
            <div class="flex items-center">
              <ui-img
                v-if="pkg.icon?.startsWith('http')"
                :src="pkg.icon"
                class="overflow-hidden rounded-lg"
                style="height: 40px; width: 40px"
                alt="Can not display"
              />
              <span v-else class="p-2 rounded-lg bg-box-transparent">
                <v-remixicon :name="pkg.icon || 'mdiPackageVariantClosed'" />
              </span>
              <div class="flex-grow" />
              <ui-popover>
                <template #trigger>
                  <v-remixicon
                    name="riMoreLine"
                    class="text-gray-600 dark:text-gray-200 cursor-pointer"
                  />
                </template>
                <ui-list class="w-44">
                  <ui-list-item
                    v-close-popover
                    class="cursor-pointer text-red-500 dark:text-red-400"
                    @click="deletePackage(pkg)"
                  >
                    <v-remixicon name="riPencilLine" class="mr-2 -ml-1" />
                    <span>{{ t('common.delete') }}</span>
                  </ui-list-item>
                </ui-list>
              </ui-popover>
            </div>
            <router-link
              :to="`/packages/${pkg.id}`"
              class="mt-4 flex-1 cursor-pointer"
            >
              <p class="font-semibold text-overflow">
                {{ pkg.name }}
              </p>
              <p
                class="line-clamp text-gray-600 dark:text-gray-200 leading-tight"
              >
                {{ pkg.description }}
              </p>
            </router-link>
            <div
              class="flex items-center text-gray-600 dark:text-gray-200 mt-2"
            >
              <p class="flex-1">{{ dayjs(pkg.createdAt).fromNow() }}</p>
              <p v-if="pkg.author">By {{ pkg.author }}</p>
            </div>
          </ui-card>
        </div>
      </div>
    </div>
    <ui-modal
      v-model="addState.show"
      :title="t('packages.add')"
      @close="clearNewPackage"
    >
      <ui-input
        v-model="addState.name"
        :placeholder="t('common.name')"
        autofocus
        class="w-full"
        @keyup.enter="addPackage"
      />
      <ui-textarea
        v-model="addState.description"
        :placeholder="t('common.description')"
        style="min-height: 200px"
        class="w-full mt-2"
      />
      <div class="flex space-x-4 mt-6">
        <ui-button class="flex-1" @click="clearNewPackage">
          {{ t('common.cancel') }}
        </ui-button>
        <ui-button class="flex-1" variant="accent" @click="addPackage">
          {{ t('packages.add') }}
        </ui-button>
      </div>
    </ui-modal>
  </div>
</template>
<script setup>
import { reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDialog } from '@/composable/dialog';
import { usePackageStore } from '@/stores/package';
import { arraySorter } from '@/utils/helper';
import dayjs from '@/lib/dayjs';

const { t } = useI18n();
const dialog = useDialog();
const packageStore = usePackageStore();

const sorts = ['name', 'createdAt'];
const categories = [
  { id: 'all', name: t('common.all') },
  { id: 'user-pkgs', name: t('packages.categories.my') },
  { id: 'installed-pkgs', name: t('packages.categories.installed') },
];

const state = reactive({
  query: '',
  activeCat: 'all',
});
const sortState = reactive({
  order: 'desc',
  by: 'createdAt',
});
const addState = reactive({
  show: false,
  name: '',
  description: '',
});

const packages = computed(() => {
  const filtered = packageStore.packages.filter((item) => {
    let isInCategory = true;
    const query = item.name
      .toLocaleLowerCase()
      .includes(state.query.toLocaleLowerCase());

    if (state.activeCat !== 'all') {
      isInCategory =
        state.activeCat === 'user-pkgs' ? !item.isExternal : item.isExternal;
    }

    return isInCategory && query;
  });

  return arraySorter({
    data: filtered,
    key: sortState.by,
    order: sortState.order,
  });
});

function deletePackage({ id, name }) {
  dialog.confirm({
    title: 'Delete package',
    body: `Are you sure want to delete "${name}" package?`,
    okVariant: 'danger',
    okText: 'Delete',
    onConfirm: () => {
      packageStore.delete(id);
    },
  });
}
function clearNewPackage() {
  Object.assign(addState, {
    name: '',
    show: false,
    description: '',
  });
}
async function addPackage() {
  try {
    await packageStore.insert({
      name: addState.name.trim() || 'Unnamed',
      description: addState.description,
    });

    clearNewPackage();
  } catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <div class="container pt-8 pb-4">
    <h1 class="text-2xl font-semibold mb-6 capitalize">
      {{ t('common.workflow', 2) }}
    </h1>
    <div class="flex items-center mb-6 space-x-4">
      <ui-input
        v-model="state.query"
        prepend-icon="riSearch2Line"
        :placeholder="`${t(`common.search`)}...`"
        class="flex-1"
      />
      <div class="flex items-center workflow-sort">
        <ui-button
          icon
          class="rounded-r-none border-gray-300 border-r"
          @click="state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc'"
        >
          <v-remixicon
            :name="state.sortOrder === 'asc' ? 'riSortAsc' : 'riSortDesc'"
          />
        </ui-button>
        <ui-select v-model="state.sortBy" :placeholder="t('sort.sortBy')">
          <option v-for="sort in sorts" :key="sort" :value="sort">
            {{ t(`sort.${sort}`) }}
          </option>
        </ui-select>
      </div>
      <ui-button @click="importWorkflow">
        <v-remixicon name="riUploadLine" class="mr-2 -ml-1" />
        {{ t('workflow.import') }}
      </ui-button>
      <ui-button variant="accent" @click="newWorkflow">
        {{ t('workflow.new') }}
      </ui-button>
    </div>
    <div v-if="Workflow.all().length === 0" class="py-12 flex items-center">
      <img src="@/assets/svg/alien.svg" class="w-96" />
      <div class="ml-4">
        <h1 class="text-2xl font-semibold max-w-md mb-6">
          {{ t('message.empty') }}
        </h1>
        <ui-button variant="accent" @click="newWorkflow">
          {{ t('workflow.new') }}
        </ui-button>
      </div>
    </div>
    <div v-else class="grid gap-4 grid-cols-5 2xl:grid-cols-6">
      <shared-card
        v-for="workflow in workflows"
        :key="workflow.id"
        :data="workflow"
        @click="$router.push(`/workflows/${$event.id}`)"
      >
        <template #header>
          <div class="flex items-center mb-4">
            <template v-if="!workflow.isDisabled">
              <ui-img
                v-if="workflow.icon.startsWith('http')"
                :src="workflow.icon"
                class="rounded-lg overflow-hidden"
                style="height: 40px; width: 40px"
                alt="Can not display"
              />
              <span v-else class="p-2 rounded-lg bg-box-transparent">
                <v-remixicon :name="workflow.icon" />
              </span>
            </template>
            <p v-else class="py-2">{{ t('common.disabled') }}</p>
            <div class="flex-grow"></div>
            <button
              v-if="!workflow.isDisabled"
              class="invisible group-hover:visible"
              @click="executeWorkflow(workflow)"
            >
              <v-remixicon name="riPlayLine" />
            </button>
            <ui-popover class="h-6 ml-2">
              <template #trigger>
                <button>
                  <v-remixicon name="riMoreLine" />
                </button>
              </template>
              <ui-list class="space-y-1" style="min-width: 150px">
                <ui-list-item
                  class="cursor-pointer"
                  @click="
                    updateWorkflow(workflow.id, {
                      isDisabled: !workflow.isDisabled,
                    })
                  "
                >
                  <v-remixicon name="riToggleLine" class="mr-2 -ml-1" />
                  <span class="capitalize">{{
                    t(`common.${workflow.isDisabled ? 'enable' : 'disable'}`)
                  }}</span>
                </ui-list-item>
                <ui-list-item
                  v-for="item in menu"
                  :key="item.id"
                  v-close-popover
                  class="cursor-pointer"
                  @click="menuHandlers[item.id](workflow)"
                >
                  <v-remixicon :name="item.icon" class="mr-2 -ml-1" />
                  <span class="capitalize">{{ item.name }}</span>
                </ui-list-item>
              </ui-list>
            </ui-popover>
          </div>
        </template>
      </shared-card>
    </div>
  </div>
</template>
<script setup>
import { computed, shallowReactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDialog } from '@/composable/dialog';
import { sendMessage } from '@/utils/message';
import { exportWorkflow, importWorkflow } from '@/utils/workflow-data';
import SharedCard from '@/components/newtab/shared/SharedCard.vue';
import Workflow from '@/models/workflow';
import { isWhiteSpace } from '@/utils/helper';

const dialog = useDialog();
const { t } = useI18n();

const sorts = ['name', 'createdAt'];
const menu = [
  { id: 'export', name: t('common.export'), icon: 'riDownloadLine' },
  { id: 'rename', name: t('common.rename'), icon: 'riPencilLine' },
  { id: 'delete', name: t('common.delete'), icon: 'riDeleteBin7Line' },
];

const savedSorts = JSON.parse(localStorage.getItem('workflow-sorts') || '{}');
const state = shallowReactive({
  query: '',
  sortBy: savedSorts.sortBy || 'createdAt',
  sortOrder: savedSorts.sortOrder || 'desc',
});

const workflows = computed(() =>
  Workflow.query()
    .where(({ name }) =>
      name.toLocaleLowerCase().includes(state.query.toLocaleLowerCase())
    )
    .orderBy(state.sortBy, state.sortOrder)
    .get()
);

function executeWorkflow(workflow) {
  sendMessage('workflow:execute', workflow, 'background');
}
function updateWorkflow(id, data) {
  Workflow.update({
    where: id,
    data,
  });
}
function newWorkflow() {
  dialog.prompt({
    title: t('workflow.new'),
    placeholder: t('common.name'),
    okText: t('workflow.add'),
    onConfirm: (name) => {
      Workflow.insert({
        data: {
          name: name || 'Unnamed',
          createdAt: Date.now(),
        },
      });
    },
  });
}
function deleteWorkflow({ name, id }) {
  dialog.confirm({
    title: t('workflow.delete'),
    okVariant: 'danger',
    body: t('message.delete', { name }),
    onConfirm: () => {
      Workflow.delete(id);
    },
  });
}
function renameWorkflow({ id, name }) {
  dialog.prompt({
    title: t('workflow.rename'),
    placeholder: t('common.name'),
    okText: t('common.rename'),
    inputValue: name,
    onConfirm: (newName) => {
      Workflow.update({
        where: id,
        data: {
          name: newName,
        },
      });
      console.log(Workflow.data);
    },
  });
}

function setIconWorkflow({ id }) {
  dialog.prompt({
    title: 'Set icon workflow',
    placeholder: 'URL of the new icon',
    okText: 'Set Icon',
    inputValue: '',
    onConfirm: (iconUrl) => {
      let isIconFromURL = true;
      if (!iconUrl || isWhiteSpace(iconUrl)) {
        iconUrl = String('riGlobalLine');
        isIconFromURL = false;
      }

      Workflow.update({
        where: id,
        data: {
          icon: String(iconUrl),
          isIconFromURL,
        },
      });
    },
  });
}
const menuHandlers = {
  export: exportWorkflow,
  rename: renameWorkflow,
  delete: deleteWorkflow,
  setIcon: setIconWorkflow,
};

watch(
  () => [state.sortOrder, state.sortBy],
  ([sortOrder, sortBy]) => {
    localStorage.setItem(
      'workflow-sorts',
      JSON.stringify({ sortOrder, sortBy })
    );
  }
);
</script>
<style>
.workflow-sort select {
  @apply rounded-l-none !important;
}
</style>

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
        v-bind="{ data: workflow, menu }"
        :key="workflow.id"
        @click="$router.push(`/workflows/${$event.id}`)"
        @execute="executeWorkflow"
        @menuSelected="menuHandlers[$event.id]($event.data)"
      />
    </div>
  </div>
</template>
<script setup>
import { computed, shallowReactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDialog } from '@/composable/dialog';
import { sendMessage } from '@/utils/message';
import { exportWorkflow, importWorkflow } from '@/utils/workflow-data';
import SharedCard from '@/components/newtab/shared/SharedCard.vue';
import Workflow from '@/models/workflow';

const dialog = useDialog();
const { t } = useI18n();

const sorts = ['name', 'createdAt'];
const menu = [
  { id: 'export', name: t('common.export'), icon: 'riDownloadLine' },
  { id: 'rename', name: t('common.rename'), icon: 'riPencilLine' },
  { id: 'delete', name: t('common.delete'), icon: 'riDeleteBin7Line' },
];

const state = shallowReactive({
  query: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
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
    },
  });
}

const menuHandlers = {
  export: exportWorkflow,
  rename: renameWorkflow,
  delete: deleteWorkflow,
};
</script>
<style>
.workflow-sort select {
  @apply rounded-l-none !important;
}
</style>

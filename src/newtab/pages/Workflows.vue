<template>
  <div class="container pt-8 pb-4">
    <h1 class="text-2xl font-semibold mb-6">Workflows</h1>
    <div class="flex items-center mb-6 space-x-4">
      <ui-input
        v-model="state.query"
        prepend-icon="riSearch2Line"
        placeholder="Search..."
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
        <ui-select v-model="state.sortBy" placeholder="Sort by">
          <option v-for="sort in sorts" :key="sort.id" :value="sort.id">
            {{ sort.name }}
          </option>
        </ui-select>
      </div>
      <ui-button variant="accent" @click="newWorkflow">
        New workflow
      </ui-button>
    </div>
    <div v-if="Workflow.all().length === 0" class="py-12 flex items-center">
      <img src="@/assets/svg/alien.svg" class="w-96" />
      <div class="ml-4">
        <h1 class="text-2xl font-semibold max-w-md mb-6">
          Oppss... It's looks like you don't have any workflows.
        </h1>
        <ui-button variant="accent" @click="newWorkflow"
          >New workflow</ui-button
        >
      </div>
    </div>
    <div v-else class="grid gap-4 grid-cols-5">
      <workflow-card
        v-for="workflow in workflows"
        :key="workflow.id"
        v-bind="{ workflow }"
        @delete="deleteWorkflow"
        @rename="renameWorkflow"
        @execute="executeWorkflow"
      />
    </div>
  </div>
</template>
<script setup>
import { computed, shallowReactive } from 'vue';
import { useDialog } from '@/composable/dialog';
import { sendMessage } from '@/utils/message';
import WorkflowCard from '@/components/newtab/workflow/WorkflowCard.vue';
import Workflow from '@/models/workflow';

const dialog = useDialog();

const sorts = [
  { name: 'Name', id: 'name' },
  { name: 'Created date', id: 'createdAt' },
  { name: 'Running date', id: 'lastRunAt' },
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
    title: 'New workflow',
    placeholder: 'Workflow name',
    okText: 'Add workflow',
    onConfirm: (name) => {
      Workflow.insert({
        data: {
          name,
          createdAt: Date.now(),
        },
      });
    },
  });
}
function deleteWorkflow({ name, id }) {
  dialog.confirm({
    title: 'Delete workflow',
    okVariant: 'danger',
    body: `Are you sure you want to delete "${name}" workflow?`,
    onConfirm: () => {
      Workflow.delete(id);
    },
  });
}
function renameWorkflow({ id, name }) {
  dialog.prompt({
    title: 'Rename workflow',
    placeholder: 'Workflow name',
    okText: 'Rename',
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
</script>
<style>
.workflow-sort select {
  @apply rounded-l-none !important;
}
</style>

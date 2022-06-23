<template>
  <div v-if="workflowStore.local.length === 0" class="py-12 flex items-center">
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
  <template v-else>
    <div class="workflows-container">
      <shared-card
        v-for="workflow in workflows"
        :key="workflow.id"
        :data="workflow"
        :data-workflow="workflow.id"
        draggable="true"
        class="cursor-default select-none ring-accent local-workflow"
        @dragstart="onDragStart"
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
              <span
                v-else
                class="p-2 rounded-lg bg-box-transparent inline-block"
              >
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
                  @click="toggleDisableWorkflow(workflow)"
                >
                  <v-remixicon name="riToggleLine" class="mr-2 -ml-1" />
                  <span class="capitalize">
                    {{
                      t(`common.${workflow.isDisabled ? 'enable' : 'disable'}`)
                    }}
                  </span>
                </ui-list-item>
                <ui-list-item
                  v-for="item in menu"
                  :key="item.id"
                  v-close-popover
                  class="cursor-pointer"
                  @click="item.action(workflow)"
                >
                  <v-remixicon :name="item.icon" class="mr-2 -ml-1" />
                  <span class="capitalize">{{ item.name }}</span>
                </ui-list-item>
              </ui-list>
            </ui-popover>
          </div>
        </template>
        <template #footer-content>
          <v-remixicon
            v-if="workflowStore.shared[workflow.id]"
            v-tooltip:bottom.group="
              t('workflow.share.sharedAs', {
                name: workflowStore.shared[workflow.id]?.name.slice(0, 64),
              })
            "
            name="riShareLine"
            size="20"
            class="ml-2"
          />
          <v-remixicon
            v-if="workflowStore.hosted[workflow.id]"
            v-tooltip:bottom.group="t('workflow.host.title')"
            name="riBaseStationLine"
            size="20"
            class="ml-2"
          />
        </template>
      </shared-card>
    </div>
    <div
      v-if="workflows.length > 18"
      class="flex items-center justify-between mt-8"
    >
      <div>
        {{ t('components.pagination.text1') }}
        <select v-model="pagination.perPage" class="p-1 rounded-md bg-input">
          <option v-for="num in [18, 32, 64, 128]" :key="num" :value="num">
            {{ num }}
          </option>
        </select>
        {{
          t('components.pagination.text2', {
            count: workflows.length,
          })
        }}
      </div>
      <ui-pagination
        v-model="pagination.currentPage"
        :per-page="pagination.perPage"
        :records="workflows.length"
      />
    </div>
  </template>
  <ui-modal v-model="renameState.show" title="Workflow">
    <ui-input
      v-model="renameState.name"
      :placeholder="t('common.name')"
      autofocus
      class="w-full mb-4"
      @keyup.enter="renameWorkflow"
    />
    <ui-textarea
      v-model="renameState.description"
      :placeholder="t('common.description')"
      height="165px"
      class="w-full dark:text-gray-200"
      max="300"
      style="min-height: 140px"
    />
    <p class="mb-6 text-right text-gray-600 dark:text-gray-200">
      {{ renameState.description.length }}/300
    </p>
    <div class="space-x-2 flex">
      <ui-button class="w-full" @click="clearRenameModal">
        {{ t('common.cancel') }}
      </ui-button>
      <ui-button variant="accent" class="w-full" @click="renameWorkflow">
        {{ t('common.update') }}
      </ui-button>
    </div>
  </ui-modal>
</template>
<script setup>
import { shallowReactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import SelectionArea from '@viselect/vanilla';
import { useDialog } from '@/composable/dialog';
import { useWorkflowStore } from '@/stores/workflow';
import { arraySorter } from '@/utils/helper';
import { exportWorkflow } from '@/utils/workflowData';
import SharedCard from '@/components/newtab/shared/SharedCard.vue';

const props = defineProps({
  search: {
    type: String,
    default: '',
  },
  folderId: {
    type: String,
    default: '',
  },
  sort: {
    type: Object,
    default: () => ({
      by: '',
      order: '',
    }),
  },
  perPage: {
    type: Number,
    default: 18,
  },
});

const { t } = useI18n();
const dialog = useDialog();
const workflowStore = useWorkflowStore();

const state = shallowReactive({
  selectedWorkflows: [],
});
const renameState = shallowReactive({
  id: '',
  name: '',
  show: false,
  description: '',
});
const pagination = shallowReactive({
  currentPage: 1,
  perPage: +`${props.perPage}` || 18,
});

const selection = new SelectionArea({
  container: '.workflows-list',
  startareas: ['.workflows-list'],
  boundaries: ['.workflows-list'],
  selectables: ['.local-workflow'],
});
selection
  .on('beforestart', ({ event }) => {
    return (
      event.target.tagName !== 'INPUT' &&
      !event.target.closest('.local-workflow')
    );
  })
  .on('start', () => {
    /* eslint-disable-next-line */
  clearSelectedWorkflows();
  })
  .on('move', (event) => {
    event.store.changed.added.forEach((el) => {
      el.classList.add('ring-2');
    });
    event.store.changed.removed.forEach((el) => {
      el.classList.remove('ring-2');
    });
  })
  .on('stop', (event) => {
    state.selectedWorkflows = event.store.selected.map(
      (el) => el.dataset?.workflow
    );
  });

const filteredWorkflows = computed(() => {
  const filtered = workflowStore.local.filter(
    ({ name, folderId }) =>
      name.toLocaleLowerCase().includes(props.search.toLocaleLowerCase()) &&
      (!props.activeFolder || props.activeFolder === folderId)
  );

  return arraySorter({
    data: filtered,
    key: props.sort.by,
    order: props.sort.order,
  });
});
const workflows = computed(() =>
  filteredWorkflows.value.slice(
    (pagination.currentPage - 1) * pagination.perPage,
    pagination.currentPage * pagination.perPage
  )
);

function toggleDisableWorkflow({ id, isDisabled }) {
  workflowStore.updateWorkflow({
    id,
    location: 'local',
    data: {
      isDisabled: !isDisabled,
    },
  });
}
function clearRenameModal() {
  Object.assign(renameState, {
    id: '',
    name: '',
    show: false,
    description: '',
  });
}
function initRenameWorkflow({ name, description, id }) {
  Object.assign(renameState, {
    id,
    name,
    show: true,
    description,
  });
}
function renameWorkflow() {
  workflowStore.updateWorkflow({
    location: 'local',
    id: renameState.id,
    data: {
      name: renameState.name,
      description: renameState.description,
    },
  });
  clearRenameModal();
}
function deleteWorkflow({ name, id }) {
  dialog.confirm({
    title: t('workflow.delete'),
    okVariant: 'danger',
    body: t('message.delete', { name }),
    onConfirm: () => {
      workflowStore.deleteWorkflow(id, 'local');
    },
  });
}
function deleteSelectedWorkflows({ target, key }) {
  const excludeTags = ['INPUT', 'TEXTAREA', 'SELECT'];
  if (
    excludeTags.includes(target.tagName) ||
    key !== 'Delete' ||
    state.selectedWorkflows.length === 0
  )
    return;

  if (state.selectedWorkflows.length === 1) {
    const [workflowId] = state.selectedWorkflows;
    const workflow = workflowStore.getById('local', workflowId);
    deleteWorkflow(workflow);
  } else {
    dialog.confirm({
      title: t('workflow.delete'),
      okVariant: 'danger',
      body: t('message.delete', {
        name: `${state.selectedWorkflows.length} workflows`,
      }),
      onConfirm: async () => {
        for (const workflowId of state.selectedWorkflows) {
          await workflowStore.deleteWorkflow(workflowId, 'local');
        }
      },
    });
  }
}
function duplicateWorkflow(workflow) {
  const copyWorkflow = { ...workflow, createdAt: Date.now() };
  const delKeys = ['$id', 'data', 'id', 'isDisabled'];

  delKeys.forEach((key) => {
    delete copyWorkflow[key];
  });

  workflowStore.addWorkflow(copyWorkflow);
}
function onDragStart({ dataTransfer, target }) {
  const payload = [...state.selectedWorkflows];

  const targetId = target.dataset?.workflow;
  if (targetId && !payload.includes(targetId)) payload.push(targetId);

  dataTransfer.setData('workflows', JSON.stringify(payload));
}
function clearSelectedWorkflows() {
  state.selectedWorkflows = [];

  selection.getSelection().forEach((el) => {
    el.classList.remove('ring-2');
  });
  selection.clearSelection();
}

const menu = [
  {
    id: 'duplicate',
    name: t('common.duplicate'),
    icon: 'riFileCopyLine',
    action: duplicateWorkflow,
  },
  {
    id: 'export',
    name: t('common.export'),
    icon: 'riDownloadLine',
    action: exportWorkflow,
  },
  {
    id: 'rename',
    name: t('common.rename'),
    icon: 'riPencilLine',
    action: initRenameWorkflow,
  },
  {
    id: 'delete',
    name: t('common.delete'),
    icon: 'riDeleteBin7Line',
    action: deleteWorkflow,
  },
];

onMounted(() => {
  window.addEventListener('keydown', deleteSelectedWorkflows);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', deleteSelectedWorkflows);
});
</script>

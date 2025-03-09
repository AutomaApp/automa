<template>
  <div
    v-if="workflowStore.getWorkflows.length === 0"
    class="md:flex items-center md:text-left text-center py-12"
  >
    <img src="@/assets/svg/alien.svg" class="w-96" />
    <div class="ml-4">
      <h1 class="mb-6 max-w-md text-2xl font-semibold">
        {{ t('message.empty') }}
      </h1>
    </div>
  </div>
  <template v-else>
    <div v-if="pinnedWorkflows.length > 0" class="mb-8 border-b pb-8">
      <div class="flex items-center">
        <v-remixicon name="riPushpin2Line" class="mr-2" size="20" />
        <span>{{ t('workflow.pinWorkflow.pinned') }}</span>
      </div>
      <div class="workflows-container mt-4">
        <workflows-local-card
          v-for="workflow in pinnedWorkflows"
          :key="workflow.id"
          :workflow="workflow"
          :is-hosted="userStore.hostedWorkflows[workflow.id]"
          :is-shared="sharedWorkflowStore.getById(workflow.id)"
          :is-pinned="true"
          :menu="menu"
          @dragstart="onDragStart"
          @execute="RendererWorkflowService.executeWorkflow(workflow)"
          @toggle-pin="togglePinWorkflow(workflow)"
          @toggle-disable="toggleDisableWorkflow(workflow)"
        />
      </div>
    </div>
    <div class="workflows-container">
      <workflows-local-card
        v-for="workflow in workflows"
        :key="workflow.id"
        :workflow="workflow"
        :is-hosted="userStore.hostedWorkflows[workflow.id]"
        :is-shared="sharedWorkflowStore.getById(workflow.id)"
        :is-pinned="state.pinnedWorkflows.includes(workflow.id)"
        :menu="menu"
        @dragstart="onDragStart"
        @execute="RendererWorkflowService.executeWorkflow(workflow)"
        @toggle-pin="togglePinWorkflow(workflow)"
        @toggle-disable="toggleDisableWorkflow(workflow)"
      />
    </div>
    <div
      v-if="filteredWorkflows.length > 18"
      class="mt-8 flex items-center justify-between"
    >
      <div>
        {{ t('components.pagination.text1') }}
        <select
          :value="pagination.perPage"
          class="bg-input rounded-md p-1"
          @change="onPerPageChange"
        >
          <option v-for="num in [18, 32, 64, 128]" :key="num" :value="num">
            {{ num }}
          </option>
        </select>
        {{
          t('components.pagination.text2', {
            count: filteredWorkflows.length,
          })
        }}
      </div>
      <ui-pagination
        v-model="pagination.currentPage"
        :per-page="pagination.perPage"
        :records="filteredWorkflows.length"
      />
    </div>
  </template>
  <ui-modal v-model="renameState.show" title="Workflow">
    <ui-input
      v-model="renameState.name"
      :placeholder="t('common.name')"
      autofocus
      class="mb-4 w-full"
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
    <div class="flex space-x-2">
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
import {
  shallowReactive,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import SelectionArea from '@viselect/vanilla';
import browser from 'webextension-polyfill';
import cloneDeep from 'lodash.clonedeep';
import { arraySorter } from '@/utils/helper';
import { useUserStore } from '@/stores/user';
import { useDialog } from '@/composable/dialog';
import { useWorkflowStore } from '@/stores/workflow';
import { exportWorkflow } from '@/utils/workflowData';
import { useSharedWorkflowStore } from '@/stores/sharedWorkflow';
import RendererWorkflowService from '@/service/renderer/RendererWorkflowService';
import WorkflowsLocalCard from './WorkflowsLocalCard.vue';

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
const emit = defineEmits(['update:perPage']);

const { t } = useI18n();
const dialog = useDialog();
const userStore = useUserStore();
const workflowStore = useWorkflowStore();
const sharedWorkflowStore = useSharedWorkflowStore();

const state = shallowReactive({
  pinnedWorkflows: [],
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
  behaviour: {
    overlap: 'invert',
  },
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
    document.body.style.userSelect = 'none';
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
    document.body.style.userSelect = '';
  });

const filteredWorkflows = computed(() => {
  const filtered = workflowStore.getWorkflows.filter(
    ({ name, folderId }) =>
      name.toLocaleLowerCase().includes(props.search.toLocaleLowerCase()) &&
      (!props.folderId || props.folderId === folderId)
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
const pinnedWorkflows = computed(() => {
  const list = [];
  state.pinnedWorkflows.forEach((workflowId) => {
    const workflow = workflowStore.getById(workflowId);
    if (
      !workflow ||
      !workflow.name
        .toLocaleLowerCase()
        .includes(props.search.toLocaleLowerCase())
    )
      return;

    list.push(workflow);
  });

  return arraySorter({
    data: list,
    key: props.sort.by,
    order: props.sort.order,
  });
});

function onPerPageChange(event) {
  const { value } = event.target;
  pagination.perPage = +value;
  emit('update:perPage', +value);
}
function toggleDisableWorkflow({ id, isDisabled }) {
  workflowStore.update({
    id,
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
  workflowStore.update({
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
      workflowStore.delete(id);
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
    const workflow = workflowStore.getById(workflowId);
    deleteWorkflow(workflow);
  } else {
    dialog.confirm({
      title: t('workflow.delete'),
      okVariant: 'danger',
      body: t('message.delete', {
        name: `${state.selectedWorkflows.length} workflows`,
      }),
      onConfirm: async () => {
        await workflowStore.delete(state.selectedWorkflows);
      },
    });
  }
}
function duplicateWorkflow(workflow) {
  const clonedWorkflow = cloneDeep(workflow);
  const delKeys = ['$id', 'data', 'id', 'isDisabled'];

  delKeys.forEach((key) => {
    delete clonedWorkflow[key];
  });

  clonedWorkflow.createdAt = Date.now();
  clonedWorkflow.name += ' - copy';

  workflowStore.insert(clonedWorkflow);
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
function togglePinWorkflow(workflow) {
  const index = state.pinnedWorkflows.indexOf(workflow.id);
  const copyData = [...state.pinnedWorkflows];

  if (index === -1) {
    copyData.push(workflow.id);
  } else {
    copyData.splice(index, 1);
  }

  state.pinnedWorkflows = copyData;
  browser.storage.local.set({
    pinnedWorkflows: copyData,
  });
}

const menu = [
  {
    id: 'copy-id',
    name: 'Copy workflow id',
    icon: 'riFileCopyLine',
    action: (workflow) => {
      navigator.clipboard.writeText(workflow.id).catch((error) => {
        console.error(error);

        const textarea = document.createElement('textarea');
        textarea.value = workflow.id;
        textarea.select();
        document.execCommand('copy');
        textarea.blur();
      });
    },
  },
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

watch(
  () => props.folderId,
  () => {
    pagination.currentPage = 1;
  }
);

onMounted(() => {
  window.addEventListener('keydown', deleteSelectedWorkflows);

  browser.storage.local.get('pinnedWorkflows').then((storage) => {
    state.pinnedWorkflows = storage.pinnedWorkflows || [];
  });
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', deleteSelectedWorkflows);
});
</script>
<style>
.selection-area {
  background: rgba(46, 115, 252, 0.11);
  border: 2px solid rgba(98, 155, 255, 0.81);
  border-radius: 0.1em;
}
</style>

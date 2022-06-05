<template>
  <div class="container pt-8 pb-4">
    <h1 class="text-2xl font-semibold mb-8 capitalize">
      {{ t('common.workflow', 2) }}
    </h1>
    <div class="flex items-start">
      <div class="w-60 sticky top-8">
        <div class="flex w-full">
          <ui-button
            :title="shortcut['action:new'].readable"
            variant="accent"
            class="border-r rounded-r-none flex-1 font-semibold"
            @click="newWorkflow"
          >
            {{ t('workflow.new') }}
          </ui-button>
          <ui-popover>
            <template #trigger>
              <ui-button icon class="rounded-l-none" variant="accent">
                <v-remixicon name="riArrowLeftSLine" rotate="-90" />
              </ui-button>
            </template>
            <ui-list class="space-y-1">
              <ui-list-item
                v-close-popover
                class="cursor-pointer"
                @click="importWorkflow({ multiple: true })"
              >
                {{ t('workflow.import') }}
              </ui-list-item>
              <ui-list-item
                v-close-popover
                class="cursor-pointer"
                @click="addHostWorkflow"
              >
                {{ t('workflow.host.add') }}
              </ui-list-item>
            </ui-list>
          </ui-popover>
        </div>
        <ui-list class="mt-6 space-y-2">
          <ui-list-item
            tag="a"
            href="https://www.automa.site/workflows"
            target="_blank"
          >
            <v-remixicon name="riCompass3Line" />
            <span class="ml-4 capitalize">
              {{ t('workflow.browse') }}
            </span>
          </ui-list-item>
          <ui-expand
            :model-value="true"
            append-icon
            header-class="px-4 py-2 rounded-lg hoverable w-full flex items-center"
          >
            <template #header>
              <v-remixicon name="riFlowChart" />
              <span class="ml-4 capitalize flex-1 text-left">
                {{ t('workflow.my') }}
              </span>
            </template>
            <ui-list class="space-y-1 mt-1">
              <ui-list-item
                tag="button"
                :active="state.activeTab === 'local'"
                color="bg-box-transparent font-semibold"
                class="pl-14"
                @click="state.activeTab = 'local'"
              >
                <span class="capitalize">
                  {{ t('workflow.type.local') }}
                </span>
              </ui-list-item>
              <ui-list-item
                v-if="store.state.user"
                :active="state.activeTab === 'shared'"
                tag="button"
                color="bg-box-transparent font-semibold"
                class="pl-14"
                @click="state.activeTab = 'shared'"
              >
                <span class="capitalize">
                  {{ t('workflow.type.shared') }}
                </span>
              </ui-list-item>
              <ui-list-item
                v-if="workflowHosts.length > 0"
                :active="state.activeTab === 'host'"
                color="bg-box-transparent font-semibold"
                tag="button"
                class="pl-14"
                @click="state.activeTab = 'host'"
              >
                <span class="capitalize">
                  {{ t('workflow.type.host') }}
                </span>
              </ui-list-item>
            </ui-list>
          </ui-expand>
        </ui-list>
        <workflows-folder
          v-if="state.activeTab === 'local'"
          v-model="state.activeFolder"
        />
      </div>
      <div
        class="flex-1 workflows-list ml-8"
        style="min-height: calc(100vh - 8rem)"
        @dblclick="clearSelectedWorkflows"
      >
        <div class="flex items-center">
          <ui-input
            id="search-input"
            v-model="state.query"
            :placeholder="`${t(`common.search`)}... (${
              shortcut['action:search'].readable
            })`"
            prepend-icon="riSearch2Line"
          />
          <div class="flex-grow"></div>
          <span v-tooltip:bottom.group="t('workflow.backupCloud')" class="mr-4">
            <ui-button tag="router-link" to="/backup" class="inline-block" icon>
              <v-remixicon name="riUploadCloud2Line" />
            </ui-button>
          </span>
          <div class="flex items-center workflow-sort">
            <ui-button
              icon
              class="rounded-r-none border-gray-300 dark:border-gray-700 border-r"
              @click="
                state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc'
              "
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
        </div>
        <ui-tab-panels v-model="state.activeTab" class="flex-1 mt-6">
          <ui-tab-panel value="shared">
            <div class="workflows-container">
              <shared-card
                v-for="workflow in sharedWorkflows"
                :key="workflow.id"
                :data="workflow"
                :show-details="false"
                @execute="executeWorkflow(workflow)"
                @click="$router.push(`/workflows/${$event.id}?shared=true`)"
              />
            </div>
          </ui-tab-panel>
          <ui-tab-panel value="host">
            <div class="workflows-container">
              <shared-card
                v-for="workflow in workflowHosts"
                :key="workflow.hostId"
                :data="workflow"
                :menu="workflowHostMenu"
                @execute="executeWorkflow(workflow)"
                @click="$router.push(`/workflows/${$event.hostId}/host`)"
                @menuSelected="deleteWorkflowHost(workflow)"
              />
            </div>
          </ui-tab-panel>
          <ui-tab-panel value="local">
            <div
              v-if="Workflow.all().length === 0"
              class="py-12 flex items-center"
            >
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
                  v-for="workflow in localWorkflows"
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
                      <v-remixicon
                        v-if="workflow.isProtected"
                        name="riShieldKeyholeLine"
                        class="text-green-600 dark:text-green-400 ml-2"
                      />
                      <ui-popover v-if="!workflow.isProtected" class="h-6 ml-2">
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
                            <v-remixicon
                              name="riToggleLine"
                              class="mr-2 -ml-1"
                            />
                            <span class="capitalize">
                              {{
                                t(
                                  `common.${
                                    workflow.isDisabled ? 'enable' : 'disable'
                                  }`
                                )
                              }}
                            </span>
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
                  <template #footer-content>
                    <v-remixicon
                      v-if="sharedWorkflows[workflow.id]"
                      v-tooltip:bottom.group="
                        t('workflow.share.sharedAs', {
                          name: sharedWorkflows[workflow.id]?.name.slice(0, 64),
                        })
                      "
                      name="riShareLine"
                      size="20"
                      class="ml-2"
                    />
                    <v-remixicon
                      v-if="hostWorkflows[workflow.id]"
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
                  <select
                    v-model="pagination.perPage"
                    class="p-1 rounded-md bg-input"
                  >
                    <option
                      v-for="num in [18, 32, 64, 128]"
                      :key="num"
                      :value="num"
                    >
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
          </ui-tab-panel>
        </ui-tab-panels>
      </div>
    </div>
    <ui-modal v-model="workflowModal.show" title="Workflow">
      <ui-input
        v-model="workflowModal.name"
        :placeholder="t('common.name')"
        autofocus
        class="w-full mb-4"
        @keyup.enter="handleWorkflowModal"
      />
      <ui-textarea
        v-model="workflowModal.description"
        :placeholder="t('common.description')"
        height="165px"
        class="w-full dark:text-gray-200"
        max="300"
      />
      <p class="mb-6 text-right text-gray-600 dark:text-gray-200">
        {{ workflowModal.description.length }}/300
      </p>
      <div class="space-x-2 flex">
        <ui-button class="w-full" @click="workflowModal.show = false">
          {{ t('common.cancel') }}
        </ui-button>
        <ui-button variant="accent" class="w-full" @click="handleWorkflowModal">
          {{
            workflowModal.type === 'update'
              ? t('common.update')
              : t('common.add')
          }}
        </ui-button>
      </div>
    </ui-modal>
  </div>
</template>
<script setup>
import {
  computed,
  shallowReactive,
  watch,
  onMounted,
  onBeforeUnmount,
} from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import browser from 'webextension-polyfill';
import { useDialog } from '@/composable/dialog';
import { useShortcut } from '@/composable/shortcut';
import { useGroupTooltip } from '@/composable/groupTooltip';
import { sendMessage } from '@/utils/message';
import { fetchApi } from '@/utils/api';
import { exportWorkflow, importWorkflow } from '@/utils/workflowData';
import {
  registerWorkflowTrigger,
  cleanWorkflowTriggers,
} from '@/utils/workflowTrigger';
import { findTriggerBlock, isWhitespace } from '@/utils/helper';
import SharedCard from '@/components/newtab/shared/SharedCard.vue';
import Workflow from '@/models/workflow';
import WorkflowsFolder from '@/components/newtab/workflows/WorkflowsFolder.vue';
import SelectionArea from '@viselect/vanilla';

useGroupTooltip();
const { t } = useI18n();
const toast = useToast();
const store = useStore();
const dialog = useDialog();

const sorts = ['name', 'createdAt'];
const menu = [
  { id: 'duplicate', name: t('common.duplicate'), icon: 'riFileCopyLine' },
  { id: 'export', name: t('common.export'), icon: 'riDownloadLine' },
  { id: 'rename', name: t('common.rename'), icon: 'riPencilLine' },
  { id: 'delete', name: t('common.delete'), icon: 'riDeleteBin7Line' },
];
const workflowHostMenu = [
  { id: 'delete', name: t('common.delete'), icon: 'riDeleteBin7Line' },
];

const savedSorts = JSON.parse(localStorage.getItem('workflow-sorts') || '{}');
const state = shallowReactive({
  query: '',
  activeFolder: '',
  activeTab: 'local',
  selectedWorkflows: [],
  sortBy: savedSorts.sortBy || 'createdAt',
  sortOrder: savedSorts.sortOrder || 'desc',
});
const workflowModal = shallowReactive({
  name: '',
  type: 'update',
  description: '',
});
const pagination = shallowReactive({
  currentPage: 1,
  perPage: savedSorts.perPage || 18,
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
      (el) => el.dataset.workflow
    );
  });

const hostWorkflows = computed(() => store.state.hostWorkflows || {});
const workflowHosts = computed(() => Object.values(store.state.workflowHosts));
const sharedWorkflows = computed(() => store.state.sharedWorkflows || {});
const workflows = computed(() =>
  Workflow.query()
    .where(
      ({ name, folderId }) =>
        name.toLocaleLowerCase().includes(state.query.toLocaleLowerCase()) &&
        (!state.activeFolder || state.activeFolder === folderId)
    )
    .orderBy(state.sortBy, state.sortOrder)
    .get()
);
const localWorkflows = computed(() =>
  workflows.value.slice(
    (pagination.currentPage - 1) * pagination.perPage,
    pagination.currentPage * pagination.perPage
  )
);

function clearSelectedWorkflows() {
  state.selectedWorkflows = [];

  selection.getSelection().forEach((el) => {
    el.classList.remove('ring-2');
  });
  selection.clearSelection();
}
function onDragStart({ dataTransfer, target }) {
  const payload = [...state.selectedWorkflows];

  const targetId = target.dataset.workflow;
  if (targetId && !payload.includes(targetId)) payload.push(targetId);

  dataTransfer.setData('workflows', JSON.stringify(payload));
}
async function deleteWorkflowHost(workflow) {
  dialog.confirm({
    title: t('workflow.delete'),
    okVariant: 'danger',
    body: t('message.delete', { name: workflow.name }),
    onConfirm: async () => {
      try {
        store.commit('deleteStateNested', `workflowHosts.${workflow.hostId}`);

        await browser.storage.local.set({
          workflowHosts: store.state.sharedWorkflows,
        });
        await cleanWorkflowTriggers(workflow.hostId);
      } catch (error) {
        console.error(error);
      }
    },
  });
}
function addHostWorkflow() {
  dialog.prompt({
    async: true,
    inputType: 'url',
    okText: t('common.add'),
    title: t('workflow.host.add'),
    label: t('workflow.host.id'),
    placeholder: 'abcd123',
    onConfirm: async (value) => {
      try {
        if (isWhitespace(value)) return false;

        let length = 0;
        let isItsOwn = false;
        let isHostExist = false;
        const hostId = value.replace(/\s/g, '');

        workflowHosts.value.forEach((host) => {
          if (hostId === host.hostId) isHostExist = true;

          length += 1;
        });

        if (!store.state.user && length >= 3) {
          toast.error(t('message.rateExceeded'));
          return false;
        }

        Object.values(store.state.hostWorkflows).forEach((host) => {
          if (hostId === host.hostId) isItsOwn = true;
        });

        if (isHostExist || isItsOwn) {
          toast.error(t('workflow.host.messages.hostExist'));
          return false;
        }

        const response = await fetchApi('/workflows/hosted', {
          method: 'POST',
          body: JSON.stringify({ hostId }),
        });
        const result = await response.json();

        if (!response.ok) {
          const error = new Error(result.message);
          error.data = result.data;

          throw error;
        }

        if (result === null) {
          toast.error(t('workflow.host.messages.notFound', { id: hostId }));
          return false;
        }

        result.hostId = hostId;
        result.createdAt = Date.now();

        store.commit('updateStateNested', {
          value: result,
          path: `workflowHosts.${hostId}`,
        });

        const triggerBlock = findTriggerBlock(result.drawflow);
        await registerWorkflowTrigger(hostId, triggerBlock);

        result.drawflow = JSON.stringify(result.drawflow);

        let { workflowHosts: storageHosts } = await browser.storage.local.get(
          'workflowHosts'
        );
        (storageHosts = storageHosts || {})[hostId] = result;

        await browser.storage.local.set({ workflowHosts: storageHosts });

        return true;
      } catch (error) {
        console.error(error);

        toast.error(
          error.data?.show ? error.message : t('message.somethingWrong')
        );

        return false;
      }
    },
  });
}
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
  Object.assign(workflowModal, {
    name: '',
    show: true,
    type: 'add',
    description: '',
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
function deleteSelectedWorkflows({ target, key }) {
  const excludeTags = ['INPUT', 'TEXTAREA', 'SELECT'];
  if (
    excludeTags.includes(target.tagName) ||
    key !== 'Delete' ||
    state.selectedWorkflows.length === 0
  )
    return;

  if (state.selectedWorkflows.length === 1) {
    const workflow = Workflow.find(state.selectedWorkflows[0]);
    deleteWorkflow(workflow);
  } else {
    dialog.confirm({
      title: t('workflow.delete'),
      okVariant: 'danger',
      body: t('message.delete', {
        name: `${state.selectedWorkflows.length} workflows`,
      }),
      onConfirm: () => {
        state.selectedWorkflows.forEach((id) => {
          Workflow.delete(id);
        });
      },
    });
  }
}
function renameWorkflow({ id, name, description }) {
  Object.assign(workflowModal, {
    id,
    name,
    description,
    show: true,
    type: 'update',
  });
}
async function handleWorkflowModal() {
  try {
    if (workflowModal.type === 'add') {
      await Workflow.insert({
        data: {
          createdAt: Date.now(),
          name: workflowModal.name || 'Unnamed',
          description: workflowModal.description,
        },
      });
    } else {
      await Workflow.update({
        where: workflowModal.id,
        data: {
          name: workflowModal.name,
          description: workflowModal.description,
        },
      });
    }

    Object.assign(workflowModal, {
      name: '',
      show: false,
      description: '',
    });
  } catch (error) {
    console.error(error);
  }
}
function duplicateWorkflow(workflow) {
  const copyWorkflow = { ...workflow, createdAt: Date.now() };
  const delKeys = ['$id', 'data', 'id', 'isDisabled'];

  delKeys.forEach((key) => {
    delete copyWorkflow[key];
  });

  Workflow.insert({ data: copyWorkflow });
}

const shortcut = useShortcut(['action:search', 'action:new'], ({ id }) => {
  if (id === 'action:search') {
    const searchInput = document.querySelector('#search-input input');
    searchInput?.focus();
  } else {
    newWorkflow();
  }
});
const menuHandlers = {
  export: exportWorkflow,
  rename: renameWorkflow,
  delete: deleteWorkflow,
  duplicate: duplicateWorkflow,
};

watch(
  () => [state.sortOrder, state.sortBy, pagination.perPage],
  ([sortOrder, sortBy, perPage]) => {
    localStorage.setItem(
      'workflow-sorts',
      JSON.stringify({ sortOrder, sortBy, perPage })
    );
  }
);

onMounted(() => {
  window.addEventListener('keydown', deleteSelectedWorkflows);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', deleteSelectedWorkflows);
});
</script>
<style>
.workflow-sort select {
  @apply rounded-l-none !important;
}
.workflows-container {
  @apply grid gap-4 grid-cols-3 2xl:grid-cols-4;
}
</style>

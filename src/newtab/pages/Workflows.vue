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
            @click="addWorkflowModal.show = true"
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
                @click="addHostedWorkflow"
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
                v-if="userStore.user"
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
                v-if="hostedWorkflows.length > 0"
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
          <ui-tab-panel value="shared" class="workflows-container">
            <workflows-shared
              :search="state.query"
              :sort="{ by: state.sortBy, order: state.sortOrder }"
            />
          </ui-tab-panel>
          <ui-tab-panel value="host" class="workflows-container">
            <workflows-hosted
              :search="state.query"
              :sort="{ by: state.sortBy, order: state.sortOrder }"
            />
          </ui-tab-panel>
          <ui-tab-panel value="local">
            <workflows-local
              :search="state.query"
              :per-page="state.perPage"
              :folder-id="state.activeFolder"
              :sort="{ by: state.sortBy, order: state.sortOrder }"
            />
          </ui-tab-panel>
        </ui-tab-panels>
      </div>
    </div>
    <ui-modal v-model="addWorkflowModal.show" title="Workflow">
      <ui-input
        v-model="addWorkflowModal.name"
        :placeholder="t('common.name')"
        autofocus
        class="w-full mb-4"
        @keyup.enter="addWorkflow"
      />
      <ui-textarea
        v-model="addWorkflowModal.description"
        :placeholder="t('common.description')"
        height="165px"
        class="w-full dark:text-gray-200"
        max="300"
      />
      <p class="mb-6 text-right text-gray-600 dark:text-gray-200">
        {{ addWorkflowModal.description.length }}/300
      </p>
      <div class="space-x-2 flex">
        <ui-button class="w-full" @click="clearAddWorkflowModal">
          {{ t('common.cancel') }}
        </ui-button>
        <ui-button variant="accent" class="w-full" @click="addWorkflow">
          {{ t('common.add') }}
        </ui-button>
      </div>
    </ui-modal>
  </div>
</template>
<script setup>
import { computed, shallowReactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useDialog } from '@/composable/dialog';
import { useShortcut } from '@/composable/shortcut';
import { useGroupTooltip } from '@/composable/groupTooltip';
import { fetchApi } from '@/utils/api';
import { importWorkflow } from '@/utils/workflowData';
import { registerWorkflowTrigger } from '@/utils/workflowTrigger';
import { findTriggerBlock, isWhitespace } from '@/utils/helper';
import { useUserStore } from '@/stores/user';
import { useWorkflowStore } from '@/stores/workflow';
import WorkflowsLocal from '@/components/newtab/workflows/WorkflowsLocal.vue';
import WorkflowsShared from '@/components/newtab/workflows/WorkflowsShared.vue';
import WorkflowsHosted from '@/components/newtab/workflows/WorkflowsHosted.vue';
import WorkflowsFolder from '@/components/newtab/workflows/WorkflowsFolder.vue';

useGroupTooltip();
const { t } = useI18n();
const toast = useToast();
const dialog = useDialog();
const userStore = useUserStore();
const workflowStore = useWorkflowStore();

const sorts = ['name', 'createdAt'];

const savedSorts = JSON.parse(localStorage.getItem('workflow-sorts') || '{}');
const state = shallowReactive({
  query: '',
  activeFolder: '',
  activeTab: 'local',
  perPage: savedSorts.perPage || 18,
  sortBy: savedSorts.sortBy || 'createdAt',
  sortOrder: savedSorts.sortOrder || 'desc',
});
const addWorkflowModal = shallowReactive({
  name: '',
  show: false,
  description: '',
});

const hostedWorkflows = computed(() => Object.values(workflowStore.hosted));

function clearAddWorkflowModal() {
  Object.assign(addWorkflowModal, {
    name: '',
    show: false,
    description: '',
  });
}
function addWorkflow() {
  workflowStore.addWorkflow({
    name: addWorkflowModal.name,
    description: addWorkflowModal.description,
  });
  clearAddWorkflowModal();
}
function addHostedWorkflow() {
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

        hostedWorkflows.value.forEach((host) => {
          if (hostId === host.hostId) isHostExist = true;

          length += 1;
        });

        if (!userStore.user && length >= 3) {
          toast.error(t('message.rateExceeded'));
          return false;
        }

        Object.values(workflowStore.userHosted).forEach((host) => {
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

        workflowStore.hosted[hostId] = result;
        const triggerBlock = findTriggerBlock(result.drawflow);
        await registerWorkflowTrigger(hostId, triggerBlock);

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

const shortcut = useShortcut(['action:search', 'action:new'], ({ id }) => {
  if (id === 'action:search') {
    const searchInput = document.querySelector('#search-input input');
    searchInput?.focus();
  } else {
    addWorkflowModal.show = true;
  }
});

watch(
  () => [state.sortOrder, state.sortBy, state.perPage],
  ([sortOrder, sortBy, perPage]) => {
    localStorage.setItem(
      'workflow-sorts',
      JSON.stringify({ sortOrder, sortBy, perPage })
    );
  }
);
</script>
<style>
.workflow-sort select {
  @apply rounded-l-none !important;
}
.workflows-container {
  @apply grid gap-4 grid-cols-3 2xl:grid-cols-4;
}
</style>

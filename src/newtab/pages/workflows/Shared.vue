<template>
  <div v-if="workflow" class="relative h-screen">
    <div class="absolute top-0 left-0 z-10 flex w-full items-center p-4">
      <ui-card
        padding="px-2"
        class="flex items-center overflow-hidden"
        style="min-width: 150px; height: 48px"
      >
        <span class="inline-block">
          <ui-img
            v-if="workflow.icon.startsWith('http')"
            :src="workflow.icon"
            class="h-8 w-8"
          />
          <v-remixicon v-else :name="workflow.icon" size="26" />
        </span>
        <div class="ml-2 max-w-sm">
          <p
            :class="{ 'text-lg': !workflow.description }"
            class="text-overflow font-semibold leading-tight"
          >
            {{ workflow.name }}
          </p>
          <p
            :class="{ 'text-sm': workflow.description }"
            class="text-overflow leading-tight text-gray-600 dark:text-gray-200"
          >
            {{ workflow.description }}
          </p>
        </div>
      </ui-card>
      <ui-card padding="p-1 ml-4">
        <ui-input
          v-tooltip="t('workflow.share.url')"
          prepend-icon="riLinkM"
          :model-value="`https://automa.site/workflow/${workflow.id}`"
          readonly
          @click="$event.target.select()"
        />
      </ui-card>
      <div class="pointer-events-none grow" />
      <ui-card padding="p-1 ml-4">
        <router-link
          v-if="state.hasLocalCopy"
          v-tooltip.group="'Go to local version'"
          :to="`/workflows/${workflowId}`"
          class="hoverable block rounded-lg p-2"
        >
          <v-remixicon name="riComputerLine" />
        </router-link>
      </ui-card>
      <ui-card padding="p-1 ml-4">
        <button
          v-if="state.hasLocalCopy"
          v-tooltip.group="t('workflow.share.fetchLocal')"
          class="hoverable rounded-lg p-2"
          @click="fetchLocalWorkflow"
        >
          <v-remixicon name="riRefreshLine" />
        </button>
        <button
          v-else
          v-tooltip.group="t('workflow.share.download')"
          class="hoverable rounded-lg p-2"
          @click="insertToLocal"
        >
          <v-remixicon name="riDownloadLine" />
        </button>
        <button
          v-tooltip.group="t('workflow.share.edit')"
          class="hoverable rounded-lg p-2"
          @click="initEditWorkflow"
        >
          <v-remixicon name="riFileEditLine" />
        </button>
      </ui-card>
      <ui-card padding="p-1 flex ml-4">
        <button
          v-tooltip.group="t('workflow.share.unpublish')"
          class="hoverable relative mr-2 rounded-lg p-2"
          @click="unpublishSharedWorkflow"
        >
          <ui-spinner
            v-if="state.isUnpublishing"
            color="text-accent"
            class="absolute top-2 left-2"
          />
          <v-remixicon
            name="riLock2Line"
            :class="{ 'opacity-75': state.isUnpublishing }"
          />
        </button>
        <ui-button
          :loading="state.isUpdating"
          :disabled="state.isUnpublishing"
          variant="accent"
          @click="saveUpdatedSharedWorkflow"
        >
          <span
            v-if="state.isChanged"
            class="absolute top-0 left-0 -ml-1 -mt-1 flex h-3 w-3"
          >
            <span
              class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"
            ></span>
            <span
              class="relative inline-flex h-3 w-3 rounded-full bg-blue-600"
            ></span>
          </span>
          {{ t('workflow.share.update') }}
        </ui-button>
      </ui-card>
    </div>
    <workflow-editor
      v-if="state.retrieved"
      :id="route.params.id"
      :key="state.editorKey"
      :data="workflow.drawflow"
      :options="editorOptions"
      :disabled="true"
      class="h-full w-full"
      @init="onEditorInit"
    />
  </div>
  <ui-modal
    v-model="editState.showModal"
    custom-content
    @close="updateSharedWorkflow(editState.data)"
  >
    <workflow-share
      :workflow="workflow"
      is-update
      @change="onEditWorkflowChange"
    >
      <template #prepend>
        <div class="mb-6 flex justify-between">
          <p>{{ t('workflow.share.edit') }}</p>
          <v-remixicon
            name="riCloseLine"
            class="cursor-pointer"
            @click="
              editState.showModal = false;
              updateSharedWorkflow(editState.data);
            "
          />
        </div>
      </template>
    </workflow-share>
  </ui-modal>
</template>
<script setup>
import { reactive, onMounted, watch, shallowRef, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHead } from '@vueuse/head';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import browser from 'webextension-polyfill';
import { fetchApi } from '@/utils/api';
import { useDialog } from '@/composable/dialog';
import { useGroupTooltip } from '@/composable/groupTooltip';
import { useWorkflowStore } from '@/stores/workflow';
import { useSharedWorkflowStore } from '@/stores/sharedWorkflow';
import convertWorkflowData from '@/utils/convertWorkflowData';
import WorkflowShare from '@/components/newtab/workflow/WorkflowShare.vue';
import WorkflowEditor from '@/components/newtab/workflow/WorkflowEditor.vue';

useGroupTooltip();

const { t } = useI18n();
const toast = useToast();
const route = useRoute();
const router = useRouter();
const dialog = useDialog();
const workflowStore = useWorkflowStore();
const sharedWorkflowStore = useSharedWorkflowStore();

const workflowId = route.params.id;
const editorOptions = {
  disabled: true,
  fitViewOnInit: true,
  nodesDraggable: false,
  edgesUpdatable: false,
  nodesConnectable: false,
  elementsSelectable: false,
};

const editState = reactive({
  showModal: false,
  data: {
    name: '',
    content: '',
    category: '',
    description: '',
  },
});
const state = reactive({
  editorKey: 0,
  retrieved: false,
  isChanged: false,
  isUpdating: false,
  isUnpublishing: false,
  trigger: 'Trigger: Manually',
});
const editor = shallowRef(null);

const workflow = computed(() => sharedWorkflowStore.getById(route.params.id));

useHead({
  title: () =>
    workflow.value?.name
      ? `${workflow.value.name} workflow`
      : 'Shared workflow',
});

const changingKeys = new Set();

function updateSharedWorkflow(data = {}) {
  Object.keys(data).forEach((key) => {
    changingKeys.add(key);
  });

  sharedWorkflowStore.update({
    data,
    id: workflowId,
  });

  if (data.drawflow) {
    editor.value.setNodes(data.drawflow.nodes);
    editor.value.setEdges(data.drawflow.edges);
    editor.value.fitView();
  }

  state.isChanged = true;
}
function initEditWorkflow() {
  ['name', 'content', 'category', 'description'].forEach((key) => {
    editState.data[key] = workflow.value[key];
  });
  editState.showModal = true;
}
function onEditWorkflowChange({ name, content, category, description }) {
  editState.data.name = name;
  editState.data.content = content;
  editState.data.category = category;
  editState.data.description = description;
}
function unpublishSharedWorkflow() {
  dialog.confirm({
    title: t('workflow.unpublish.title'),
    body: t('workflow.unpublish.body', { name: workflow.value.name }),
    okVariant: 'danger',
    okText: t('workflow.unpublish.button'),
    async onConfirm() {
      try {
        state.isUnpublishing = true;

        const response = await fetchApi(`/me/workflows/shared/${workflowId}`, {
          auth: true,
          method: 'DELETE',
        });

        if (response.status !== 200) {
          throw new Error(response.statusText);
        }

        sharedWorkflowStore.delete(workflowId);
        sessionStorage.setItem(
          'shared-workflows',
          JSON.stringify(workflowStore.workflows)
        );

        router.push('/');

        state.isUnpublishing = false;
      } catch (error) {
        console.error(error);
        state.isUnpublishing = false;
        toast.error(t('message.somethingWrong'));
      }
    },
  });
}
async function saveUpdatedSharedWorkflow() {
  try {
    state.isUpdating = true;

    const payload = {};
    changingKeys.forEach((key) => {
      if (key === 'drawflow') {
        const flow = workflow.value.drawflow;
        payload.drawflow = typeof flow === 'string' ? JSON.parse(flow) : flow;
      } else {
        payload[key] = workflow.value[key];
      }
    });

    const url = `/me/workflows/shared/${workflowId}`;
    const response = await fetchApi(url, {
      auth: true,
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (response.status !== 200) {
      toast.error(t('message.somethingWrong'));
      throw new Error(response.statusText);
    }

    state.isChanged = false;
    changingKeys.clear();
    sessionStorage.setItem(
      'shared-workflows',
      JSON.stringify(sharedWorkflowStore.workflows)
    );

    state.isUpdating = false;
  } catch (error) {
    console.error(error);
    state.isUpdating = false;
  }
}
function fetchLocalWorkflow() {
  const workflowData = {};
  const keys = [
    'drawflow',
    'name',
    'description',
    'icon',
    'globalData',
    'dataColumns',
    'table',
    'settings',
  ];
  const localWorkflow = workflowStore.getById(workflowId);

  keys.forEach((key) => {
    workflowData[key] = localWorkflow[key];
  });

  const convertedData = convertWorkflowData(workflowData);
  convertedData.version = browser.runtime.getManifest().version;

  updateSharedWorkflow(convertedData);
}
function insertToLocal() {
  const copy = {
    ...workflow.value,
    createdAt: Date.now(),
    version: browser.runtime.getManifest().version,
  };

  workflowStore.insert(copy, { duplicateId: true }).then(() => {
    state.hasLocalCopy = true;
  });
}
function onEditorInit(instance) {
  instance.setInteractive(false);
  editor.value = instance;
}

watch(workflow, () => {
  state.editorKey += 1;
});

onMounted(() => {
  if (!workflow.value) {
    router.push('/workflows');
    return;
  }

  const convertedData = convertWorkflowData(workflow.value);
  sharedWorkflowStore.update({
    id: workflowId,
    data: {
      drawflow: convertedData.drawflow ?? workflow.value.drawflow,
    },
  });

  state.hasLocalCopy = workflowStore.getWorkflows.some(
    ({ id }) => id === workflowId
  );

  state.retrieved = true;
});
</script>
<style>
.parent-drawflow.is-shared .drawflow-node * {
  pointer-events: none;
}
.parent-drawflow.is-shared .drawflow-node .move-to-group,
.parent-drawflow.is-shared .drawflow-node .menu {
  display: none;
}
</style>

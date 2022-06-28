<template>
  <div v-if="workflow" class="h-screen relative">
    <div class="absolute top-0 left-0 w-full flex items-center p-4 z-10">
      <ui-card
        padding="px-2"
        class="flex items-center overflow-hidden"
        style="min-width: 150px; height: 48px"
      >
        <span class="inline-block">
          <ui-img
            v-if="workflow.icon.startsWith('http')"
            :src="workflow.icon"
            class="w-8 h-8"
          />
          <v-remixicon v-else :name="workflow.icon" size="26" />
        </span>
        <div class="ml-2 max-w-sm">
          <p
            :class="{ 'text-lg': !workflow.description }"
            class="font-semibold leading-tight text-overflow"
          >
            {{ workflow.name }}
          </p>
          <p
            :class="{ 'text-sm': workflow.description }"
            class="text-gray-600 leading-tight dark:text-gray-200 text-overflow"
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
      <div class="flex-grow pointer-events-none" />
      <ui-card padding="p-1 ml-4">
        <router-link
          v-if="state.hasLocalCopy"
          v-tooltip.group="'Go to local version'"
          :to="`/workflows/${workflowId}`"
          class="hoverable p-2 rounded-lg block"
        >
          <v-remixicon name="riComputerLine" />
        </router-link>
      </ui-card>
      <ui-card padding="p-1 ml-4">
        <button
          v-if="state.hasLocalCopy"
          v-tooltip.group="t('workflow.share.fetchLocal')"
          class="hoverable p-2 rounded-lg"
          @click="fetchLocalWorkflow"
        >
          <v-remixicon name="riRefreshLine" />
        </button>
        <button
          v-else
          v-tooltip.group="t('workflow.share.download')"
          class="hoverable p-2 rounded-lg"
          @click="insertToLocal"
        >
          <v-remixicon name="riDownloadLine" />
        </button>
        <button
          v-tooltip.group="t('workflow.share.edit')"
          class="hoverable p-2 rounded-lg"
          @click="initEditWorkflow"
        >
          <v-remixicon name="riFileEditLine" />
        </button>
      </ui-card>
      <ui-card padding="p-1 flex ml-4">
        <button
          v-tooltip.group="t('workflow.share.unpublish')"
          class="hoverable p-2 mr-2 rounded-lg relative"
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
            class="flex h-3 w-3 absolute top-0 left-0 -ml-1 -mt-1"
          >
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"
            ></span>
            <span
              class="relative inline-flex rounded-full h-3 w-3 bg-blue-600"
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
        <div class="flex justify-between mb-6">
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
import { reactive, onMounted, watch, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
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
  edgesUpdateable: false,
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
const workflow = shallowRef(null);

const changingKeys = new Set();

function updateSharedWorkflow(data = {}) {
  Object.keys(data).forEach((key) => {
    changingKeys.add(key);
  });

  Object.assign(workflow.value, data);

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
        payload.drawflow = JSON.parse(workflow.value.drawflow);
      } else {
        payload[key] = workflow.value[key];
      }
    });

    const url = `/me/workflows/shared/${workflowId}`;
    const response = await fetchApi(url, {
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

  workflowStore.insert(copy).then(() => {
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
  const currentWorkflow = sharedWorkflowStore.getById(workflowId);
  if (!currentWorkflow) {
    router.push('/workflows');
    return;
  }

  const convertedData = convertWorkflowData(currentWorkflow);
  workflow.value = convertedData;

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

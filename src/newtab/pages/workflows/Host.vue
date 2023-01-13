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
      <ui-tabs
        model-value="'editor'"
        class="ml-4 h-full space-x-1 rounded-lg border-none bg-white px-2 dark:bg-gray-800"
        style="height: 48px"
      >
        <ui-tab value="editor">{{ t('common.editor') }}</ui-tab>
        <ui-tab value="logs" @click="openLogs">
          {{ t('common.log', 2) }}
          <span
            v-if="workflowStates.length > 0"
            class="ml-2 inline-block rounded-full bg-accent p-1 text-center text-xs text-white dark:text-black"
            style="min-width: 25px"
          >
            {{ workflowStates.length }}
          </span>
        </ui-tab>
      </ui-tabs>
      <div class="grow"></div>
      <ui-card padding="p-1">
        <button
          v-tooltip.group="state.triggerText"
          class="hoverable rounded-lg p-2"
        >
          <v-remixicon name="riFlashlightLine" />
        </button>
        <button
          v-tooltip.group="
            `${t('common.execute')} (${
              shortcut['editor:execute-workflow'].readable
            })`
          "
          class="hoverable rounded-lg p-2"
          @click="executeCurrWorkflow"
        >
          <v-remixicon name="riPlayLine" />
        </button>
      </ui-card>
      <ui-card padding="p-1 ml-4 flex items-center">
        <button
          v-tooltip.group="t('common.delete')"
          class="hoverable mr-2 rounded-lg p-2"
          @click="deleteWorkflowHost"
        >
          <v-remixicon name="riDeleteBin7Line" />
        </button>
        <ui-button
          v-tooltip.group="t('workflow.host.sync.description')"
          :loading="state.loadingSync"
          variant="accent"
          @click="syncWorkflow"
        >
          {{ t('workflow.host.sync.title') }}
        </ui-button>
      </ui-card>
    </div>
    <ui-tab-panels
      v-model="state.activeTab"
      :class="{ 'container pb-4 pt-24': state.activeTab !== 'editor' }"
      class="h-full"
    >
      <ui-tab-panel class="h-full" value="editor">
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
      </ui-tab-panel>
    </ui-tab-panels>
  </div>
</template>
<script setup>
import { computed, reactive, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@vueuse/head';
import { useDialog } from '@/composable/dialog';
import { useShortcut } from '@/composable/shortcut';
import { useGroupTooltip } from '@/composable/groupTooltip';
import { findTriggerBlock } from '@/utils/helper';
import convertWorkflowData from '@/utils/convertWorkflowData';
import { useWorkflowStore } from '@/stores/workflow';
import { executeWorkflow } from '@/workflowEngine';
import { useHostedWorkflowStore } from '@/stores/hostedWorkflow';
import getTriggerText from '@/utils/triggerText';
import WorkflowEditor from '@/components/newtab/workflow/WorkflowEditor.vue';
import emitter from '@/lib/mitt';

useGroupTooltip();

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const dialog = useDialog();
const workflowStore = useWorkflowStore();
const hostedWorkflowStore = useHostedWorkflowStore();

const workflowId = route.params.id;
const editorOptions = {
  disabled: true,
  fitViewOnInit: true,
  nodesDraggable: false,
  edgesUpdatable: false,
  nodesConnectable: false,
  elementsSelectable: false,
};

/* eslint-disable-next-line */
const shortcut = useShortcut('editor:execute-workflow', executeCurrWorkflow);

const state = reactive({
  editorKey: 0,
  retrieved: false,
  loadingSync: false,
  activeTab: 'editor',
  trigger: 'Trigger: Manually',
});

const workflow = computed(() => hostedWorkflowStore.getById(workflowId));
const workflowStates = computed(() =>
  workflowStore.getWorkflowStates(workflowId)
);

useHead({
  title: () =>
    workflow.value?.name
      ? `${workflow.value.name} workflow`
      : 'Hosted workflow',
});

function openLogs() {
  emitter.emit('ui:logs', {
    workflowId,
    show: true,
  });
}
function syncWorkflow() {
  state.loadingSync = true;
  const hostId = {
    hostId: workflow.value.hostId,
    updatedAt: null,
  };

  hostedWorkflowStore
    .fetchWorkflows([hostId])
    .then(() => {
      if (!workflow.value) {
        router.replace('/workflows');
      }
      /* eslint-disable-next-line */
      retrieveTriggerText();
      state.loadingSync = false;
    })
    .catch((error) => {
      console.error(error);
      state.loadingSync = false;
    });
}
async function deleteWorkflowHost() {
  dialog.confirm({
    title: t('workflow.delete'),
    okVariant: 'danger',
    body: t('message.delete', { name: workflow.value.name }),
    onConfirm: async () => {
      try {
        await hostedWorkflowStore.delete(workflowId);

        router.replace('/workflows');
      } catch (error) {
        console.error(error);
      }
    },
  });
}
function executeCurrWorkflow() {
  const payload = {
    ...workflow.value,
    id: workflowId,
  };

  executeWorkflow(payload);
}
async function retrieveTriggerText() {
  const triggerBlock = findTriggerBlock(workflow.value.drawflow);
  if (!triggerBlock) return;

  state.triggerText = await getTriggerText(
    triggerBlock.data,
    t,
    workflowId,
    true
  );
}
function onEditorInit(editor) {
  editor.setInteractive(false);
}

watch(workflow, () => {
  state.editorKey += 1;
});

onMounted(() => {
  const currentWorkflow = hostedWorkflowStore.workflows[workflowId];
  if (!currentWorkflow) {
    router.push('/workflows');
    return;
  }

  const convertedData = convertWorkflowData(currentWorkflow);
  hostedWorkflowStore.update({ id: workflowId, ...convertedData });

  retrieveTriggerText();

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

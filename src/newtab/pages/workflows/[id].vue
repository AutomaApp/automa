<template>
  <div class="flex h-screen">
    <div
      class="w-80 bg-white py-4 relative border-l border-gray-100 flex flex-col"
    >
      <workflow-edit-block
        v-if="state.isEditBlock"
        :data="state.blockData"
        @update="updateBlockData"
        @close="(state.isEditBlock = false), (state.blockData = {})"
      />
      <workflow-details-card
        v-else
        :workflow="workflow"
        :data-changed="state.isDataChanged"
        @save="saveWorkflow"
        @execute="executeWorkflow"
        @update="updateWorkflow"
        @showDataColumns="state.showDataColumnsModal = true"
        @showSettings="state.showSettings = true"
        @rename="renameWorkflow"
        @delete="deleteWorkflow"
      />
    </div>
    <workflow-builder
      class="flex-1"
      :data="workflow.drawflow"
      @load="editor = $event"
      @deleteBlock="deleteBlock"
    />
  </div>
  <ui-modal v-model="state.showDataColumnsModal" content-class="max-w-xl">
    <template #header>Data columns</template>
    <workflow-data-columns
      v-bind="{ workflow }"
      @update="updateWorkflow"
      @close="state.showDataColumnsModal = false"
    />
  </ui-modal>
  <ui-modal v-model="state.showSettings">
    <template #header>Workflow settings</template>
    <workflow-settings v-bind="{ workflow }" @update="updateWorkflow" />
  </ui-modal>
</template>
<script setup>
/* eslint-disable consistent-return */
import {
  computed,
  reactive,
  shallowRef,
  provide,
  onMounted,
  onUnmounted,
} from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import browser from 'webextension-polyfill';
import emitter from 'tiny-emitter/instance';
import { sendMessage } from '@/utils/message';
import { debounce } from '@/utils/helper';
import { useDialog } from '@/composable/dialog';
import Workflow from '@/models/workflow';
import WorkflowBuilder from '@/components/newtab/workflow/WorkflowBuilder.vue';
import WorkflowSettings from '@/components/newtab/workflow/WorkflowSettings.vue';
import WorkflowEditBlock from '@/components/newtab/workflow/WorkflowEditBlock.vue';
import WorkflowDetailsCard from '@/components/newtab/workflow/WorkflowDetailsCard.vue';
import WorkflowDataColumns from '@/components/newtab/workflow/WorkflowDataColumns.vue';

const route = useRoute();
const router = useRouter();
const dialog = useDialog();

const workflowId = route.params.id;

const editor = shallowRef(null);
const state = reactive({
  blockData: {},
  isEditBlock: false,
  showSettings: false,
  isDataChanged: false,
  showDataColumnsModal: false,
});
const workflow = computed(() => Workflow.find(workflowId) || {});

const updateBlockData = debounce((data) => {
  state.blockData.data = data;
  state.isDataChanged = true;
  editor.value.updateNodeDataFromId(state.blockData.blockId, data);

  const inputEl = document.querySelector(
    `#node-${state.blockData.blockId} input.trigger`
  );

  if (inputEl) inputEl.dispatchEvent(new Event('change'));
}, 250);
function deleteBlock(id) {
  if (state.isEditBlock && state.blockData.blockId === id) {
    state.isEditBlock = false;
    state.blockData = {};
  }

  state.isDataChanged = true;
}
function updateWorkflow(data) {
  return Workflow.update({
    where: workflowId,
    data,
  });
}
async function handleWorkflowTrigger({ data }) {
  try {
    const workflowAlarm = await browser.alarms.get(workflowId);
    const { visitWebTriggers = [] } = await browser.storage.local.get(
      'visitWebTriggers'
    );
    let visitWebTriggerIndex = visitWebTriggers.findIndex(
      (item) => item.id === workflowId
    );

    if (workflowAlarm) await browser.alarms.clear(workflowId);
    if (visitWebTriggerIndex !== -1) {
      visitWebTriggers.splice(visitWebTriggerIndex, 1);

      visitWebTriggerIndex = -1;

      await browser.storage.local.set({ visitWebTriggers });
    }

    if (['date', 'interval'].includes(data.type)) {
      let alarmInfo;

      if (data.type === 'date') {
        alarmInfo = {
          when: data.date ? new Date(data.date).getTime() : Date.now() + 60000,
        };
      } else {
        console.log(workflowAlarm, 'workflow-alarm');
        alarmInfo = {
          periodInMinutes: data.interval,
        };

        if (data.delay > 0) alarmInfo.delayInMinutes = data.delay;
      }

      if (alarmInfo) await browser.alarms.create(workflowId, alarmInfo);
    } else if (data.type === 'visit-web' && data.url.trim() !== '') {
      const payload = {
        id: workflowId,
        url: data.url,
        isRegex: data.isUrlRegex,
      };

      if (visitWebTriggerIndex === -1) {
        visitWebTriggers.push(payload);
      } else {
        visitWebTriggers[visitWebTriggerIndex] = payload;
      }
      console.log(visitWebTriggers);
      await browser.storage.local.set({ visitWebTriggers });
    }
  } catch (error) {
    console.error(error);
  }
}
/* to-do clear alarms and trigger storage when delete workflow */
function saveWorkflow() {
  const data = editor.value.export();

  updateWorkflow({ drawflow: JSON.stringify(data) }).then(() => {
    const [triggerBlockId] = editor.value.getNodesFromName('trigger');

    if (triggerBlockId) {
      handleWorkflowTrigger(editor.value.getNodeFromId(triggerBlockId));
    }

    state.isDataChanged = false;
  });
}
function editBlock(data) {
  state.isEditBlock = true;
  state.blockData = data;
}
function executeWorkflow() {
  if (editor.value.getNodesFromName('trigger').length === 0) {
    /* eslint-disable-next-line */
    alert("Can't find a trigger block");
    return;
  }

  const payload = {
    ...workflow.value,
    drawflow: editor.value.export(),
    isTesting: state.isDataChanged,
  };

  sendMessage('workflow:execute', payload, 'background').then(() => {
    console.log('the fuck');
  });
}
function handleEditorDataChanged() {
  state.isDataChanged = true;
}
function deleteWorkflow() {
  dialog.confirm({
    title: 'Delete workflow',
    okVariant: 'danger',
    body: `Are you sure you want to delete "${workflow.value.name}" workflow?`,
    onConfirm: () => {
      Workflow.delete(route.params.id).then(() => {
        router.replace('/workflows');
      });
    },
  });
}
function renameWorkflow() {
  dialog.prompt({
    title: 'Rename workflow',
    placeholder: 'Workflow name',
    okText: 'Rename',
    inputValue: workflow.value.name,
    onConfirm: (newName) => {
      Workflow.update({
        where: route.params.id,
        data: {
          name: newName,
        },
      });
    },
  });
}

provide('workflow', {
  data: workflow,
  updateWorkflow,
  /* eslint-disable-next-line */
  showDataColumnsModal: (show = true) => (state.showDataColumnsModal = show),
});

onBeforeRouteLeave(() => {
  if (!state.isDataChanged) return;

  const answer = window.confirm(
    'Do you really want to leave? you have unsaved changes!'
  );

  if (!answer) return false;
});
onMounted(() => {
  const isWorkflowExists = Workflow.query().where('id', workflowId).exists();

  if (!isWorkflowExists) {
    router.push('/workflows');
  }

  window.onbeforeunload = () => {
    if (state.isDataChanged) {
      return 'Changes you made may not be saved.';
    }
  };

  emitter.on('editor:edit-block', editBlock);
  emitter.on('editor:data-changed', handleEditorDataChanged);
});
onUnmounted(() => {
  window.onbeforeunload = null;
  emitter.off('editor:edit-block', editBlock);
  emitter.off('editor:data-changed', handleEditorDataChanged);
});
</script>
<style>
.ghost-task {
  height: 40px;
  @apply bg-box-transparent;
}
.ghost-task:not(.workflow-task) * {
  display: none;
}
</style>

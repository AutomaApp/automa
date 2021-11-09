<template>
  <div class="flex h-screen">
    <div
      class="w-80 bg-white py-6 relative border-l border-gray-100 flex flex-col"
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
        @export="exportWorkflow"
        @execute="executeWorkflow"
        @update="updateWorkflow"
        @showDataColumns="state.showDataColumnsModal = true"
        @showSettings="state.showSettings = true"
        @rename="renameWorkflow"
        @delete="deleteWorkflow"
      />
    </div>
    <div class="flex-1 relative overflow-auto">
      <div class="absolute px-3 rounded-lg bg-white z-10 left-0 m-4 top-0">
        <ui-tabs v-model="activeTab" class="border-none h-full space-x-1">
          <ui-tab value="editor">Editor</ui-tab>
          <ui-tab value="logs">Logs</ui-tab>
          <ui-tab value="running" class="flex items-center">
            Running
            <span
              v-if="workflowState.length > 0"
              class="
                ml-2
                p-1
                text-center
                inline-block
                text-xs
                rounded-full
                bg-black
                text-white
              "
              style="min-width: 25px"
            >
              {{ workflowState.length }}
            </span>
          </ui-tab>
        </ui-tabs>
      </div>
      <keep-alive>
        <workflow-builder
          v-if="activeTab === 'editor'"
          class="h-full w-full"
          :data="workflow.drawflow"
          @load="editor = $event"
          @deleteBlock="deleteBlock"
        />
        <div v-else class="container pb-4 mt-24 px-4">
          <template v-if="activeTab === 'logs'">
            <div v-if="logs.length === 0" class="text-center">
              <img
                src="@/assets/svg/files-and-folder.svg"
                class="mx-auto max-w-sm"
              />
              <p class="text-xl font-semibold">No data to show</p>
            </div>
            <shared-logs-table :logs="logs" class="w-full">
              <template #item-append="{ log: itemLog }">
                <td class="text-right">
                  <v-remixicon
                    name="riDeleteBin7Line"
                    class="inline-block text-red-500 cursor-pointer"
                    @click="deleteLog(itemLog.id)"
                  />
                </td>
              </template>
            </shared-logs-table>
          </template>
          <template v-else-if="activeTab === 'running'">
            <div v-if="workflowState.length === 0" class="text-center">
              <img
                src="@/assets/svg/files-and-folder.svg"
                class="mx-auto max-w-sm"
              />
              <p class="text-xl font-semibold">No data to show</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <shared-workflow-state
                v-for="item in workflowState"
                :key="item.id"
                :data="item"
              />
            </div>
          </template>
        </div>
      </keep-alive>
    </div>
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
import { useStore } from 'vuex';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import browser from 'webextension-polyfill';
import emitter from 'tiny-emitter/instance';
import { sendMessage } from '@/utils/message';
import { debounce } from '@/utils/helper';
import { useDialog } from '@/composable/dialog';
import { exportWorkflow } from '@/utils/workflow-data';
import Log from '@/models/log';
import Workflow from '@/models/workflow';
import WorkflowBuilder from '@/components/newtab/workflow/WorkflowBuilder.vue';
import WorkflowSettings from '@/components/newtab/workflow/WorkflowSettings.vue';
import WorkflowEditBlock from '@/components/newtab/workflow/WorkflowEditBlock.vue';
import WorkflowDetailsCard from '@/components/newtab/workflow/WorkflowDetailsCard.vue';
import WorkflowDataColumns from '@/components/newtab/workflow/WorkflowDataColumns.vue';
import SharedLogsTable from '@/components/newtab/shared/SharedLogsTable.vue';
import SharedWorkflowState from '@/components/newtab/shared/SharedWorkflowState.vue';

const store = useStore();
const route = useRoute();
const router = useRouter();
const dialog = useDialog();

const workflowId = route.params.id;

const editor = shallowRef(null);
const activeTab = shallowRef('editor');
const state = reactive({
  blockData: {},
  isEditBlock: false,
  showSettings: false,
  isDataChanged: false,
  showDataColumnsModal: false,
});

const workflowState = computed(() =>
  store.getters.getWorkflowState(workflowId)
);
const workflow = computed(() => Workflow.find(workflowId) || {});
const logs = computed(() =>
  Log.query()
    .where((item) => item.workflowId === workflowId && !item.isInCollection)
    .orderBy('startedAt', 'desc')
    .get()
);

const updateBlockData = debounce((data) => {
  state.blockData.data = data;
  state.isDataChanged = true;
  editor.value.updateNodeDataFromId(state.blockData.blockId, data);

  const inputEl = document.querySelector(
    `#node-${state.blockData.blockId} input.trigger`
  );

  if (inputEl) inputEl.dispatchEvent(new Event('change'));
}, 250);
function deleteLog(logId) {
  Log.delete(logId).then(() => {
    store.dispatch('saveToStorage', 'logs');
  });
}
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
    const { visitWebTriggers, shortcuts } = await browser.storage.local.get([
      'visitWebTriggers',
      'shortcuts',
    ]);
    let visitWebTriggerIndex = visitWebTriggers.findIndex(
      (item) => item.id === workflowId
    );
    const keyboardShortcuts = Array.isArray(shortcuts) ? {} : shortcuts || {};
    delete keyboardShortcuts[workflowId];

    if (workflowAlarm) await browser.alarms.clear(workflowId);
    if (visitWebTriggerIndex !== -1) {
      visitWebTriggers.splice(visitWebTriggerIndex, 1);

      visitWebTriggerIndex = -1;
    }

    await browser.storage.local.set({
      visitWebTriggers,
      shortcuts: keyboardShortcuts,
    });

    if (['date', 'interval'].includes(data.type)) {
      let alarmInfo;

      if (data.type === 'date') {
        alarmInfo = {
          when: data.date ? new Date(data.date).getTime() : Date.now() + 60000,
        };
      } else {
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
        visitWebTriggers.unshift(payload);
      } else {
        visitWebTriggers[visitWebTriggerIndex] = payload;
      }

      await browser.storage.local.set({ visitWebTriggers });
    } else if (data.type === 'keyboard-shortcut') {
      keyboardShortcuts[workflowId] = data.shortcut;

      await browser.storage.local.set({ shortcuts: keyboardShortcuts });
    }
  } catch (error) {
    console.error(error);
  }
}
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

  sendMessage('workflow:execute', payload, 'background');
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

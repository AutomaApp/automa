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
      <ui-tabs
        v-model="state.activeTab"
        class="border-none px-2 rounded-lg h-full space-x-1 bg-white dark:bg-gray-800 ml-4"
        style="height: 48px"
      >
        <ui-tab value="editor">{{ t('common.editor') }}</ui-tab>
        <ui-tab value="logs">{{ t('common.log', 2) }}</ui-tab>
        <ui-tab value="running" class="flex items-center">
          {{ t('common.running') }}
          <span
            v-if="workflowState.length > 0"
            class="ml-2 p-1 text-center inline-block text-xs rounded-full bg-accent text-white dark:text-black"
            style="min-width: 25px"
          >
            {{ workflowState.length }}
          </span>
        </ui-tab>
      </ui-tabs>
      <div class="flex-grow"></div>
      <ui-card padding="p-1">
        <button
          v-tooltip.group="state.triggerText"
          class="p-2 hoverable rounded-lg"
        >
          <v-remixicon name="riFlashlightLine" />
        </button>
        <button
          v-tooltip.group="
            `${t('common.execute')} (${
              shortcut['editor:execute-workflow'].readable
            })`
          "
          class="p-2 hoverable rounded-lg"
          @click="executeWorkflow"
        >
          <v-remixicon name="riPlayLine" />
        </button>
      </ui-card>
      <ui-card padding="p-1 ml-4 flex items-center">
        <button
          v-tooltip.group="t('common.delete')"
          class="p-2 hoverable rounded-lg mr-2"
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
        <workflow-builder
          v-if="workflow?.drawflow"
          :key="state.editorKey"
          :version="false"
          :is-shared="true"
          :data="workflow.drawflow"
          class="h-full w-full"
        />
      </ui-tab-panel>
      <ui-tab-panel value="logs">
        <shared-logs-table :logs="logs" class="w-full">
          <template #item-append="{ log: itemLog }">
            <td class="text-right">
              <v-remixicon
                name="riDeleteBin7Line"
                class="inline-block text-red-500 cursor-pointer dark:text-red-400"
                @click="deleteLog(itemLog.id)"
              />
            </td>
          </template>
        </shared-logs-table>
      </ui-tab-panel>
      <ui-tab-panel value="running">
        <div class="grid grid-cols-3 gap-4">
          <shared-workflow-state
            v-for="item in workflowState"
            :key="item.id"
            :data="item"
          />
        </div>
      </ui-tab-panel>
    </ui-tab-panels>
  </div>
</template>
<script setup>
import { computed, reactive, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useDialog } from '@/composable/dialog';
import { useShortcut } from '@/composable/shortcut';
import { useGroupTooltip } from '@/composable/groupTooltip';
import { parseJSON, findTriggerBlock } from '@/utils/helper';
import { sendMessage } from '@/utils/message';
import Log from '@/models/log';
import getTriggerText from '@/utils/trigger-text';
import WorkflowBuilder from '@/components/newtab/workflow/WorkflowBuilder.vue';
import SharedLogsTable from '@/components/newtab/shared/SharedLogsTable.vue';
import SharedWorkflowState from '@/components/newtab/shared/SharedWorkflowState.vue';

useGroupTooltip();

const { t } = useI18n();
const store = useStore();
const route = useRoute();
const router = useRouter();
const dialog = useDialog();
/* eslint-disable-next-line */
const shortcut = useShortcut('editor:execute-workflow', executeWorkflow);

const workflowId = route.params.id;

const state = reactive({
  editorKey: 0,
  loadingSync: false,
  activeTab: 'editor',
  trigger: 'Trigger: Manually',
});

const workflow = computed(() => store.state.workflowHosts[workflowId]);
const workflowState = computed(() =>
  store.getters.getWorkflowState(workflowId)
);
const logs = computed(() =>
  Log.query()
    .where(
      (item) =>
        item.workflowId === workflowId &&
        (!item.isInCollection || !item.isChildLog || !item.parentLog)
    )
    .orderBy('startedAt', 'desc')
    .get()
);

function syncWorkflow() {
  state.loadingSync = true;
  const hostId = {
    hostId: workflow.value.hostId,
    updatedAt: workflow.value.updatedAt,
  };

  store
    .dispatch('fetchWorkflowHosts', [hostId])
    .then(() => {
      if (!workflow.value) {
        router.replace('/workflows');
      }
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
        store.commit('deleteStateNested', `workflowHosts.${workflowId}`);

        await browser.storage.local.set({
          workflowHosts: store.state.sharedWorkflows,
        });
        await cleanWorkflowTriggers(workflowId);

        router.replace('/workflows');
      } catch (error) {
        console.error(error);
      }
    },
  });
}
function executeWorkflow() {
  const payload = {
    ...workflow.value,
    id: workflowId,
  };

  sendMessage('workflow:execute', payload, 'background');
}
function deleteLog(logId) {
  Log.delete(logId).then(() => {
    store.dispatch('saveToStorage', 'logs');
  });
}
async function retrieveTriggerText() {
  const flow = parseJSON(workflow.value.drawflow, null);
  const triggerBlock = findTriggerBlock(flow);

  if (!triggerBlock) return;

  state.triggerText = await getTriggerText(
    triggerBlock.data,
    t,
    workflowId,
    true
  );
}

watch(
  () => workflow.value.drawflow,
  () => {
    state.editorKey += 1;
    retrieveTriggerText();
  }
);

onMounted(() => {
  if (!workflow.value) {
    router.push('/workflows');
    return;
  }

  retrieveTriggerText();
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

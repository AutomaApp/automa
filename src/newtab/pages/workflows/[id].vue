<template>
  <div v-if="protectionState.needed" class="py-12 mx-auto max-w-md w-full">
    <div
      class="inline-block p-4 bg-green-200 dark:bg-green-400 mb-4 rounded-full"
    >
      <v-remixicon name="riShieldKeyholeLine" size="52" />
    </div>
    <h1 class="text-xl dark:text-gray-100 font-semibold">
      {{ t('workflow.locked.title') }}
    </h1>
    <p class="text-gray-600 dark:text-gray-200">
      {{ t('workflow.locked.body') }}
    </p>
    <form class="flex items-center mt-6" @submit.prevent="unlockWorkflow">
      <ui-input
        v-model="protectionState.password"
        :placeholder="t('common.password')"
        :type="protectionState.showPassword ? 'text' : 'password'"
        autofocus
        class="w-80 mr-4"
      >
        <template #append>
          <v-remixicon
            :name="protectionState.showPassword ? 'riEyeOffLine' : 'riEyeLine'"
            class="absolute right-2"
            @click="
              protectionState.showPassword = !protectionState.showPassword
            "
          />
        </template>
      </ui-input>
      <ui-button variant="accent">
        {{ t('workflow.locked.unlock') }}
      </ui-button>
    </form>
    <p v-if="protectionState.message" class="ml-2 text-red-500">
      {{ t(`workflow.locked.messages.${protectionState.message}`) }}
    </p>
  </div>
  <div v-else-if="workflow" class="flex h-screen">
    <div
      v-if="state.showSidebar"
      class="w-80 bg-white dark:bg-gray-800 py-6 relative border-l border-gray-100 dark:border-gray-700 dark:border-opacity-50 flex flex-col"
    >
      <workflow-edit-block
        v-if="state.isEditBlock && workflowData.active !== 'shared'"
        :data="state.blockData"
        @update="updateBlockData"
        @close="(state.isEditBlock = false), (state.blockData = {})"
      />
      <workflow-details-card
        v-else
        :workflow="workflow"
        :data="workflowData"
        @update="updateWorkflow"
      />
    </div>
    <div class="flex-1 relative overflow-auto">
      <div class="absolute w-full flex items-center z-10 left-0 p-4 top-0">
        <ui-tabs
          v-model="activeTab"
          class="border-none px-2 rounded-lg h-full space-x-1 bg-white dark:bg-gray-800"
        >
          <button
            v-tooltip="
              `${t('workflow.toggleSidebar')} (${
                shortcut['editor:toggle-sidebar'].readable
              })`
            "
            style="margin-right: 6px"
            @click="toggleSidebar"
          >
            <v-remixicon
              :name="state.showSidebar ? 'riSideBarFill' : 'riSideBarLine'"
            />
          </button>
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
        <workflow-shared-actions
          v-if="workflowData.active === 'shared'"
          :data="workflowData"
          :workflow="workflow"
          @insertLocal="insertToLocal"
          @update="updateSharedWorkflow"
          @fetchLocal="fetchLocalWorkflow"
          @save="saveUpdatedSharedWorkflow"
          @unpublish="unpublishSharedWorkflow"
        />
        <workflow-actions
          v-else
          :data="workflowData"
          :host="hostWorkflow"
          :workflow="workflow"
          :is-data-changed="state.isDataChanged"
          @save="saveWorkflow"
          @share="shareWorkflow"
          @rename="renameWorkflow"
          @update="updateWorkflow"
          @delete="deleteWorkflow"
          @host="setAsHostWorkflow"
          @execute="executeWorkflow"
          @export="workflowExporter"
          @showModal="(state.modalName = $event), (state.showModal = true)"
        />
      </div>
      <keep-alive>
        <workflow-builder
          v-if="activeTab === 'editor' && state.drawflow !== null"
          class="h-full w-full"
          :is-shared="workflowData.active === 'shared'"
          :data="state.drawflow"
          :version="workflow.version"
          @save="saveWorkflow"
          @update="updateWorkflow"
          @load="editor = $event"
          @deleteBlock="deleteBlock"
        >
          <ui-tabs
            v-if="
              workflowData.hasLocal &&
              workflowData.hasShared &&
              !state.isDataChanged
            "
            v-model="workflowData.active"
            class="z-10 text-sm"
            color="bg-white dark:bg-gray-800"
            type="fill"
          >
            <ui-tab value="local">
              {{ t('workflow.type.local') }}
            </ui-tab>
            <ui-tab value="shared">
              {{ t('workflow.type.shared') }}
            </ui-tab>
          </ui-tabs>
        </workflow-builder>
        <div v-else class="container pb-4 mt-24 px-4">
          <template v-if="activeTab === 'logs'">
            <div v-if="logs.length === 0" class="text-center">
              <img
                src="@/assets/svg/files-and-folder.svg"
                class="mx-auto max-w-sm"
              />
              <p class="text-xl font-semibold">{{ t('message.noData') }}</p>
            </div>
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
          </template>
          <template v-else-if="activeTab === 'running'">
            <div v-if="workflowState.length === 0" class="text-center">
              <img
                src="@/assets/svg/files-and-folder.svg"
                class="mx-auto max-w-sm"
              />
              <p class="text-xl font-semibold">{{ t('message.noData') }}</p>
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
  <ui-modal
    v-model="state.showModal"
    :content-class="workflowModal?.width || 'max-w-xl'"
    v-bind="workflowModal.attrs || {}"
  >
    <template v-if="workflowModal.title" #header>
      {{ workflowModal.title }}
    </template>
    <component
      :is="workflowModal.component"
      v-bind="{ workflow }"
      v-on="workflowModal?.events || {}"
      @update="updateWorkflow"
      @close="state.showModal = false"
    />
  </ui-modal>
  <ui-modal v-model="renameModal.show" title="Workflow">
    <ui-input
      v-model="renameModal.name"
      :placeholder="t('common.name')"
      class="w-full mb-4"
      @keyup.enter="updateNameAndDesc"
    />
    <ui-textarea
      v-model="renameModal.description"
      :placeholder="t('common.description')"
      height="165px"
      class="w-full dark:text-gray-200"
      max="300"
    />
    <p class="mb-6 text-right text-gray-600 dark:text-gray-200">
      {{ renameModal.description.length }}/300
    </p>
    <div class="space-x-2 flex">
      <ui-button class="w-full" @click="renameModal.show = false">
        {{ t('common.cancel') }}
      </ui-button>
      <ui-button variant="accent" class="w-full" @click="updateNameAndDesc">
        {{ t('common.update') }}
      </ui-button>
    </div>
  </ui-modal>
</template>
<script setup>
/* eslint-disable consistent-return, no-use-before-define */
import {
  computed,
  reactive,
  shallowRef,
  provide,
  onMounted,
  onUnmounted,
  toRaw,
  watch,
} from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { useI18n } from 'vue-i18n';
import defu from 'defu';
import AES from 'crypto-js/aes';
import emitter from '@/lib/mitt';
import { useDialog } from '@/composable/dialog';
import { useShortcut } from '@/composable/shortcut';
import { sendMessage } from '@/utils/message';
import { exportWorkflow, convertWorkflow } from '@/utils/workflow-data';
import { tasks } from '@/utils/shared';
import { fetchApi } from '@/utils/api';
import {
  debounce,
  isObject,
  objectHasKey,
  parseJSON,
  throttle,
} from '@/utils/helper';
import Log from '@/models/log';
import decryptFlow, { getWorkflowPass } from '@/utils/decrypt-flow';
import Workflow from '@/models/workflow';
import workflowTrigger from '@/utils/workflow-trigger';
import WorkflowShare from '@/components/newtab/workflow/WorkflowShare.vue';
import WorkflowActions from '@/components/newtab/workflow/WorkflowActions.vue';
import WorkflowBuilder from '@/components/newtab/workflow/WorkflowBuilder.vue';
import WorkflowSettings from '@/components/newtab/workflow/WorkflowSettings.vue';
import WorkflowEditBlock from '@/components/newtab/workflow/WorkflowEditBlock.vue';
import WorkflowDataTable from '@/components/newtab/workflow/WorkflowDataTable.vue';
import WorkflowGlobalData from '@/components/newtab/workflow/WorkflowGlobalData.vue';
import WorkflowDetailsCard from '@/components/newtab/workflow/WorkflowDetailsCard.vue';
import WorkflowSharedActions from '@/components/newtab/workflow/WorkflowSharedActions.vue';
import SharedLogsTable from '@/components/newtab/shared/SharedLogsTable.vue';
import SharedWorkflowState from '@/components/newtab/shared/SharedWorkflowState.vue';

const { t } = useI18n();
const store = useStore();
const route = useRoute();
const toast = useToast();
const router = useRouter();
const dialog = useDialog();
const shortcut = useShortcut('editor:toggle-sidebar', toggleSidebar);

const editor = shallowRef(null);
const activeTab = shallowRef('editor');
const state = reactive({
  blockData: {},
  modalName: '',
  drawflow: null,
  showModal: false,
  showSidebar: true,
  isEditBlock: false,
  isLoadingFlow: false,
  isDataChanged: false,
});
const workflowData = reactive({
  isHost: false,
  hasLocal: true,
  hasShared: false,
  isChanged: false,
  isUpdating: false,
  loadingHost: false,
  isUnpublishing: false,
  changingKeys: new Set(),
  active: route.query.shared ? 'shared' : 'local',
});
const renameModal = reactive({
  show: false,
  name: '',
  description: '',
});
const protectionState = reactive({
  message: '',
  password: '',
  needed: false,
  showPassword: false,
});

const workflowId = route.params.id;
const workflowModals = {
  table: {
    icon: 'riKey2Line',
    component: WorkflowDataTable,
    title: t('workflow.table.title'),
  },
  'workflow-share': {
    icon: 'riShareLine',
    component: WorkflowShare,
    attrs: {
      blur: true,
      persist: true,
      customContent: true,
    },
    events: {
      close() {
        state.showModal = false;
        state.modalName = '';
      },
      publish() {
        workflowData.hasShared = true;

        state.showModal = false;
        state.modalName = '';
      },
    },
  },
  'global-data': {
    width: 'max-w-2xl',
    icon: 'riDatabase2Line',
    component: WorkflowGlobalData,
    title: t('common.globalData'),
  },
  settings: {
    icon: 'riSettings3Line',
    component: WorkflowSettings,
    title: t('common.settings'),
  },
};

let hostWorkflowPayload = {};

const hostWorkflow = computed(() => store.state.hostWorkflows[workflowId]);
const sharedWorkflow = computed(() => store.state.sharedWorkflows[workflowId]);
const localWorkflow = computed(() => Workflow.find(workflowId));
const workflow = computed(() =>
  workflowData.active === 'local' ? localWorkflow.value : sharedWorkflow.value
);
const workflowModal = computed(() => workflowModals[state.modalName] || {});
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
    .limit(15)
    .orderBy('startedAt', 'desc')
    .get()
);

const updateBlockData = debounce((data) => {
  let payload = data;

  state.blockData.data = data;
  state.isDataChanged = true;

  if (state.blockData.isInGroup) {
    payload = { itemId: state.blockData.itemId, data };
  } else {
    editor.value.updateNodeDataFromId(state.blockData.blockId, data);
  }

  const inputEl = document.querySelector(
    `#node-${state.blockData.blockId} input.trigger`
  );

  if (inputEl)
    inputEl.dispatchEvent(
      new CustomEvent('change', { detail: toRaw(payload) })
    );
}, 250);
const executeWorkflow = throttle(() => {
  if (editor.value.getNodesFromName('trigger').length === 0) {
    /* eslint-disable-next-line */
    toast.error(t('message.noTriggerBlock'));
    return;
  }

  const payload = {
    ...workflow.value,
    isTesting: state.isDataChanged,
    drawflow: JSON.stringify(editor.value.export()),
  };

  sendMessage('workflow:execute', payload, 'background');
}, 300);

async function updateHostedWorkflow() {
  if (!workflowData.isHost || Object.keys(hostWorkflowPayload).length === 0)
    return;

  try {
    if (hostWorkflowPayload.drawflow) {
      hostWorkflowPayload.drawflow = parseJSON(
        hostWorkflowPayload.drawflow,
        null
      );
    }

    await fetchApi(`/me/workflows/host?id=${hostWorkflow.value.hostId}`, {
      method: 'PUT',
      keepalive: true,
      body: JSON.stringify({
        workflow: hostWorkflowPayload,
      }),
    });
  } catch (error) {
    console.error(error);
  }
}
function unpublishSharedWorkflow() {
  dialog.confirm({
    title: t('workflow.unpublish.title'),
    body: t('workflow.unpublish.body', { name: workflow.value.name }),
    okVariant: 'danger',
    okText: t('workflow.unpublish.button'),
    async onConfirm() {
      try {
        workflowData.isUnpublishing = true;

        const response = await fetchApi(
          `/me/workflows/shared?workflowId=${workflowId}`,
          {
            method: 'DELETE',
          }
        );

        if (response.status !== 200) {
          throw new Error(response.statusText);
        }

        store.commit('deleteStateNested', `sharedWorkflows.${workflowId}`);
        sessionStorage.setItem(
          'shared-workflows',
          JSON.stringify(store.state.sharedWorkflows)
        );

        if (workflowData.hasLocal) {
          workflowData.active = 'local';
          workflowData.hasShared = false;
        } else {
          router.push('/');
        }

        workflowData.isUnpublishing = false;
      } catch (error) {
        console.error(error);
        workflowData.isUnpublishing = false;
        toast.error(t('message.somethingWrong'));
      }
    },
  });
}
async function saveUpdatedSharedWorkflow() {
  try {
    workflowData.isUpdating = true;

    const payload = {};
    workflowData.changingKeys.forEach((key) => {
      if (key === 'drawflow') {
        payload.drawflow = JSON.parse(workflow.value.drawflow);
      } else {
        payload[key] = workflow.value[key];
      }
    });

    const url = `/me/workflows/shared?workflowId=${workflowId}`;
    const response = await fetchApi(url, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (response.status !== 200) {
      toast.error(t('message.somethingWrong'));
      throw new Error(response.statusText);
    }

    workflowData.isChanged = false;
    workflowData.changingKeys.clear();
    sessionStorage.setItem(
      'shared-workflows',
      JSON.stringify(store.state.sharedWorkflows)
    );

    workflowData.isUpdating = false;
  } catch (error) {
    console.error(error);
    workflowData.isUpdating = false;
  }
}
function updateSharedWorkflow(data = {}) {
  Object.keys(data).forEach((key) => {
    workflowData.changingKeys.add(key);
  });

  store.commit('updateStateNested', {
    path: `sharedWorkflows.${workflowId}`,
    value: {
      ...workflow.value,
      ...data,
    },
  });
  workflowData.isChanged = true;
}
function fetchLocalWorkflow() {
  const localData = {};
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

  keys.forEach((key) => {
    if (localWorkflow.value.isProtected && key === 'drawflow') return;

    localData[key] = localWorkflow.value[key];
  });

  if (localData.drawflow) {
    editor.value.import(JSON.parse(localData.drawflow), false);
  }

  updateSharedWorkflow(localData);
}
function insertToLocal() {
  const copy = {
    ...props.workflow,
    createdAt: Date.now(),
    version: chrome.runtime.getManifest().version,
  };

  Workflow.insert({
    data: copy,
  }).then(() => {
    workflowData.hasLocal = true;
  });
}
async function setAsHostWorkflow(isHost) {
  if (!store.state.user || isHost === 'auth') {
    dialog.custom('auth', {
      title: t('auth.title'),
    });
    return;
  }

  workflowData.loadingHost = true;

  try {
    let url = '/me/workflows/host';
    let payload = {};

    if (isHost) {
      const workflowPaylod = convertWorkflow(workflow.value, ['id']);
      workflowPaylod.drawflow = parseJSON(workflow.value.drawflow, null);
      delete workflowPaylod.extVersion;

      payload = {
        method: 'POST',
        body: JSON.stringify({
          workflow: workflowPaylod,
        }),
      };
    } else {
      url += `?id=${hostWorkflow.value?.hostId}`;
      payload.method = 'DELETE';
    }

    const response = await fetchApi(url, payload);
    const result = await response.json();

    if (response.status !== 200) {
      const error = new Error(response.statusText);
      error.data = result.data;

      throw error;
    }

    if (isHost) {
      store.commit('updateStateNested', {
        path: `hostWorkflows.${workflowId}`,
        value: result,
      });
    } else {
      store.commit('deleteStateNested', `hostWorkflows.${workflowId}`);
    }

    sessionStorage.setItem(
      'host-workflows',
      JSON.stringify(store.state.hostWorkflows)
    );

    workflowData.isHost = isHost;
    workflowData.loadingHost = false;
  } catch (error) {
    console.error(error);
    workflowData.loadingHost = false;
    toast.error(
      error?.data?.show ? error.message : t('message.somethingWrong')
    );
  }
}
function shareWorkflow() {
  if (workflowData.hasShared) {
    workflowData.active = 'shared';

    return;
  }

  if (store.state.user) {
    state.modalName = 'workflow-share';
    state.showModal = true;
  } else {
    dialog.custom('auth', {
      title: t('auth.title'),
    });
  }
}
function deleteLog(logId) {
  Log.delete(logId).then(() => {
    store.dispatch('saveToStorage', 'logs');
  });
}
function workflowExporter() {
  const currentWorkflow = { ...workflow.value };

  if (currentWorkflow.isProtected) {
    currentWorkflow.drawflow = decryptFlow(
      workflow.value,
      getWorkflowPass(workflow.value.pass)
    );
    delete currentWorkflow.isProtected;
  }

  exportWorkflow(currentWorkflow);
}
function unlockWorkflow() {
  protectionState.message = '';

  const decryptedFlow = decryptFlow(workflow.value, protectionState.password);

  if (decryptedFlow.isError) {
    protectionState.message = decryptedFlow.message;
    return;
  }

  state.drawflow = decryptedFlow;
  protectionState.password = '';
  protectionState.needed = false;
}
function toggleSidebar() {
  state.showSidebar = !state.showSidebar;
  localStorage.setItem('workflow:sidebar', state.showSidebar);
}
function deleteBlock(id) {
  if (!state.isEditBlock) return;

  const isGroupBlock =
    isObject(id) && id.isInGroup && id.itemId === state.blockData.itemId;
  const isEditedBlock = state.blockData.blockId === id;

  if (isEditedBlock || isGroupBlock) {
    state.isEditBlock = false;
    state.blockData = {};
  }

  state.isDataChanged = true;
}
function updateWorkflow(data) {
  if (workflowData.active === 'shared') return;

  return Workflow.update({
    where: workflowId,
    data,
  }).then((event) => {
    delete data.id;
    delete data.pass;
    delete data.logs;
    delete data.trigger;
    delete data.createdAt;
    delete data.isDisabled;
    delete data.isProtected;

    hostWorkflowPayload = { ...hostWorkflowPayload, ...data };

    return event;
  });
}
function updateNameAndDesc() {
  updateWorkflow({
    name: renameModal.name,
    description: renameModal.description.slice(0, 300),
  }).then(() => {
    Object.assign(renameModal, {
      show: false,
      name: '',
      description: '',
    });
  });
}
async function saveWorkflow() {
  if (workflowData.active === 'shared') return;

  try {
    let flow = JSON.stringify(editor.value.export());
    const [triggerBlockId] = editor.value.getNodesFromName('trigger');
    const triggerBlock = editor.value.getNodeFromId(triggerBlockId);

    if (workflow.value.isProtected) {
      flow = AES.encrypt(flow, getWorkflowPass(workflow.value.pass)).toString();
    }

    updateWorkflow({ drawflow: flow, trigger: triggerBlock?.data }).then(() => {
      if (triggerBlock) {
        workflowTrigger.register(workflowId, triggerBlock);
      }

      state.isDataChanged = false;
    });
  } catch (error) {
    console.error(error);
  }
}
function editBlock(data) {
  if (workflowData.active === 'shared') return;

  state.isEditBlock = true;
  state.blockData = defu(data, tasks[data.id] || {});
}
function handleEditorDataChanged() {
  state.isDataChanged = true;
}
function deleteWorkflow() {
  dialog.confirm({
    title: t('workflow.delete'),
    okVariant: 'danger',
    body: t('message.delete', { name: workflow.value.name }),
    onConfirm: () => {
      Workflow.delete(route.params.id).then(() => {
        router.replace('/workflows');
      });
    },
  });
}
function renameWorkflow() {
  Object.assign(renameModal, {
    show: true,
    name: workflow.value.name,
    description: workflow.value.description,
  });
}

provide('workflow', {
  data: workflow,
  updateWorkflow,
  showDataColumnsModal: (show = true) => {
    state.showModal = show;
    state.modalName = 'table';
  },
});

watch(
  () => workflowData.active,
  (value) => {
    if (value === 'shared') {
      state.isEditBlock = false;
      state.blockData = {};
    } else if (workflow.value.isProtected) {
      protectionState.needed = true;
      return;
    }

    let drawflow = parseJSON(workflow.value.drawflow, null);

    if (!drawflow?.drawflow?.Home) {
      drawflow = { drawflow: { Home: { data: {} } } };
    }

    editor.value.import(drawflow, false);
  }
);
watch(
  () => store.state.userDataRetrieved,
  () => {
    if (workflowData.hasShared) return;

    workflowData.hasShared = objectHasKey(
      store.state.sharedWorkflows,
      workflowId
    );
    workflowData.isHost = objectHasKey(store.state.hostWorkflows, workflowId);
  }
);

onBeforeRouteLeave(() => {
  updateHostedWorkflow();

  if (!state.isDataChanged) return;

  const answer = window.confirm(t('message.notSaved'));

  if (!answer) return false;
});
onMounted(() => {
  const isWorkflowExists = Workflow.query().where('id', workflowId).exists();

  workflowData.hasLocal = isWorkflowExists;
  workflowData.hasShared = objectHasKey(
    store.state.sharedWorkflows,
    workflowId
  );
  workflowData.isHost = objectHasKey(store.state.hostWorkflows, workflowId);

  const dontHaveLocal = !isWorkflowExists && workflowData.active === 'local';
  const dontHaveShared =
    !workflowData.hasShared && workflowData.active === 'shared';

  if (dontHaveLocal || dontHaveShared) {
    router.push('/workflows');
    return;
  }

  if (workflow.value.isProtected) {
    protectionState.needed = true;
  } else {
    state.drawflow = workflow.value.drawflow;
  }

  state.showSidebar =
    JSON.parse(localStorage.getItem('workflow:sidebar')) ?? true;

  window.onbeforeunload = () => {
    updateHostedWorkflow();

    if (state.isDataChanged) {
      return t('message.notSaved');
    }
  };

  emitter.on('editor:edit-block', editBlock);
  emitter.on('editor:delete-block', deleteBlock);
  emitter.on('editor:data-changed', handleEditorDataChanged);
});
onUnmounted(() => {
  window.onbeforeunload = null;
  emitter.off('editor:edit-block', editBlock);
  emitter.off('editor:delete-block', deleteBlock);
  emitter.off('editor:data-changed', handleEditorDataChanged);
});
</script>
<style>
.ghost-task {
  height: 40px;
  @apply bg-gray-200;
}
.ghost-task:not(.workflow-task) * {
  display: none;
}

.parent-drawflow.is-shared .drawflow-node * {
  pointer-events: none;
}
.parent-drawflow.is-shared .drawflow-node .move-to-group,
.parent-drawflow.is-shared .drawflow-node .menu {
  display: none;
}
</style>

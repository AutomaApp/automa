<template>
  <div v-if="workflow" class="flex" style="height: calc(100vh - 40px)">
    <div
      v-if="state.showSidebar && haveEditAccess"
      :class="
        editState.editing
          ? 'absolute h-full md:relative z-50'
          : 'hidden md:flex'
      "
      class="w-80 flex-col border-l border-gray-100 bg-white py-6 dark:border-gray-700 dark:border-opacity-50 dark:bg-gray-800"
    >
      <workflow-edit-block
        v-if="editState.editing"
        :data="editState.blockData"
        :workflow="workflow"
        :editor="editor"
        @update="updateBlockData"
        @close="closeEditingCard"
      />
      <workflow-details-card
        v-else
        :workflow="workflow"
        @update="updateWorkflow"
      />
    </div>
    <div class="relative flex-1 overflow-auto">
      <div
        class="pointer-events-none absolute left-0 top-0 z-10 flex w-full items-center p-4"
      >
        <ui-card
          v-if="!haveEditAccess"
          padding="px-2 mr-4"
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
          :model-value="isPackage ? state.activeTab : 'editor'"
          class="pointer-events-auto h-full space-x-1 rounded-lg border-none bg-white px-2 dark:bg-gray-800"
          @change="onTabChange"
        >
          <button
            v-if="haveEditAccess"
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
          <template v-if="isPackage">
            <ui-tab value="package-details"> Details </ui-tab>
            <ui-tab value="package-settings">
              {{ t('common.settings') }}
            </ui-tab>
          </template>
          <ui-tab v-else value="logs" class="flex items-center">
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
        <ui-card v-if="isTeamWorkflow" padding="p-1 ml-4 pointer-events-auto">
          <ui-input
            v-tooltip="'Workflow URL'"
            prepend-icon="riLinkM"
            :model-value="`https://automa.site/teams/${teamId}/workflows/${workflow.id}`"
            readonly
            @click="$event.target.select()"
          />
        </ui-card>
        <div class="pointer-events-none grow" />
        <editor-used-credentials v-if="editor" :editor="editor" />
        <template v-if="isPackage">
          <ui-button
            v-if="workflow.isExternal"
            v-tooltip="t('workflow.previewMode.description')"
            class="pointer-events-auto cursor-default"
          >
            <v-remixicon name="riEyeLine" class="mr-2 -ml-1" />
            <span>{{ t('workflow.previewMode.title') }}</span>
          </ui-button>
          <editor-pkg-actions
            v-else
            :editor="editor"
            :data="workflow"
            :is-data-changed="state.dataChanged"
            @update="onActionUpdated"
          />
        </template>
        <editor-local-actions
          v-else
          :editor="editor"
          :workflow="workflow"
          :is-data-changed="state.dataChanged"
          :is-team="isTeamWorkflow"
          :is-package="isPackage"
          :can-edit="haveEditAccess"
          @update="onActionUpdated"
          @permission="checkWorkflowPermission"
          @modal="(modalState.name = $event), (modalState.show = true)"
        />
      </div>
      <ui-tab-panels
        v-model="state.activeTab"
        :class="{ 'overflow-hidden': !state.activeTab.startsWith('package') }"
        class="h-full w-full"
        @drop="onDropInEditor"
        @dragend="clearHighlightedElements"
        @dragover.prevent="onDragoverEditor"
      >
        <template v-if="isPackage">
          <ui-tab-panel value="package-details" class="container pt-24">
            <package-details :data="workflow" @update="updateWorkflow" />
          </ui-tab-panel>
          <ui-tab-panel value="package-settings" class="container pt-24">
            <package-settings
              :data="workflow"
              :editor="editor"
              @update="updateWorkflow"
              @goBlock="goToPkgBlock"
            />
          </ui-tab-panel>
        </template>
        <ui-tab-panel cache value="editor" class="w-full" @keydown="onKeydown">
          <editor-debugging
            v-if="workflow.testingMode && workflowStates.length > 0"
            :states="workflowStates"
            @goToBlock="goToBlock"
          />
          <workflow-editor
            v-if="state.workflowConverted"
            :id="route.params.id"
            :data="editorData"
            :disabled="isTeamWorkflow && !haveEditAccess"
            :class="{ 'animate-blocks': state.animateBlocks }"
            class="workflow-editor focus:outline-none"
            style="height: calc(100vh - 40px)"
            tabindex="0"
            @init="onEditorInit"
            @edit="initEditBlock"
            @update:node="state.dataChanged = true"
            @delete:node="state.dataChanged = true"
            @update:settings="onUpdateBlockSettings"
          >
            <template
              v-if="!isTeamWorkflow || haveEditAccess"
              #controls-prepend
            >
              <ui-card padding="p-0 ml-2 undo-redo">
                <button
                  v-tooltip.group="
                    `${t('workflow.undo')} (${getReadableShortcut('mod+z')})`
                  "
                  :disabled="!commandManager.state.value.canUndo"
                  class="rounded-lg p-2 transition-colors"
                  @click="executeCommand('undo')"
                >
                  <v-remixicon name="riArrowGoBackLine" />
                </button>
                <button
                  v-tooltip.group="
                    `${t('workflow.redo')} (${getReadableShortcut(
                      'mod+shift+z'
                    )})`
                  "
                  :disabled="!commandManager.state.value.canRedo"
                  class="rounded-lg p-2 transition-colors"
                  @click="executeCommand('redo')"
                >
                  <v-remixicon name="riArrowGoForwardLine" />
                </button>
              </ui-card>
              <button
                v-if="!isPackage && haveEditAccess"
                v-tooltip="t('packages.open')"
                class="control-button hoverable ml-2"
                @click="blockFolderModal.showList = !blockFolderModal.showList"
              >
                <v-remixicon name="mdiPackageVariantClosed" />
              </button>
              <button
                v-tooltip="t('workflow.autoAlign.title')"
                class="control-button hoverable ml-2"
                @click="autoAlign"
              >
                <v-remixicon name="riMagicLine" />
              </button>
              <button
                v-tooltip="t('workflow.snakeIt.title')"
                class="control-button hoverable ml-2"
                @click="snakeIt"
              >
                <v-remixicon name="riRoundedCorner" />
              </button>
            </template>
          </workflow-editor>
          <editor-local-saved-blocks
            v-if="blockFolderModal.showList"
            @close="blockFolderModal.showList = false"
          />
          <editor-local-ctx-menu
            v-if="editor"
            :editor="editor"
            :is-package="isPackage"
            :is-team="isTeamWorkflow"
            :package-io="workflow.settings?.asBlock"
            @group="groupBlocks"
            @ungroup="ungroupBlocks"
            @packageIo="addPackageIO"
            @recording="startRecording"
            @copy="copySelectedElements"
            @paste="pasteCopiedElements"
            @saveBlock="initBlockFolder"
            @duplicate="duplicateElements"
          />
        </ui-tab-panel>
      </ui-tab-panels>
    </div>
  </div>
  <ui-modal
    v-model="modalState.show"
    :content-class="activeWorkflowModal?.width || 'max-w-xl'"
    v-bind="activeWorkflowModal.attrs || {}"
  >
    <template v-if="activeWorkflowModal.title" #header>
      {{ activeWorkflowModal.title }}
      <a
        v-if="activeWorkflowModal.docs"
        :title="t('common.docs')"
        :href="activeWorkflowModal.docs"
        target="_blank"
        class="inline-block align-middle"
      >
        <v-remixicon name="riInformationLine" size="20" />
      </a>
    </template>
    <component
      :is="activeWorkflowModal.component"
      v-bind="{ workflow }"
      v-on="activeWorkflowModal?.events || {}"
      @update="updateWorkflow"
      @close="modalState.show = false"
    />
  </ui-modal>
  <shared-permissions-modal
    v-model="permissionState.showModal"
    :permissions="permissionState.items"
    @granted="registerTrigger"
  />
  <ui-modal v-model="blockFolderModal.showModal" :title="t('packages.set')">
    <editor-add-package
      :data="{
        name: blockFolderModal.name,
        description: blockFolderModal.description,
        icon: blockFolderModal.icon,
      }"
      @update="Object.assign(blockFolderModal, $event)"
      @cancel="clearBlockFolderModal"
      @add="saveBlockToFolder"
    />
  </ui-modal>
</template>
<script setup>
import {
  watch,
  provide,
  markRaw,
  reactive,
  computed,
  onMounted,
  shallowRef,
  onDeactivated,
  onBeforeUnmount,
} from 'vue';
import cloneDeep from 'lodash.clonedeep';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { customAlphabet } from 'nanoid';
import { useToast } from 'vue-toastification';
import { useHead } from '@vueuse/head';
import defu from 'defu';
import dagre from 'dagre';
import { useUserStore } from '@/stores/user';
import { usePackageStore } from '@/stores/package';
import { useWorkflowStore } from '@/stores/workflow';
import { useTeamWorkflowStore } from '@/stores/teamWorkflow';
import {
  useShortcut,
  getShortcut,
  getReadableShortcut,
} from '@/composable/shortcut';
import { getWorkflowPermissions } from '@/utils/workflowData';
import { fetchApi } from '@/utils/api';
import { getBlocks } from '@/utils/getSharedData';
import { excludeGroupBlocks } from '@/utils/shared';
import { useGroupTooltip } from '@/composable/groupTooltip';
import { useCommandManager } from '@/composable/commandManager';
import { debounce, parseJSON, throttle, getActiveTab } from '@/utils/helper';
import { executeWorkflow } from '@/workflowEngine';
import { registerWorkflowTrigger } from '@/utils/workflowTrigger';
import emitter from '@/lib/mitt';
import functions from '@/workflowEngine/templating/templatingFunctions';
import browser from 'webextension-polyfill';
import dbStorage from '@/db/storage';
import DroppedNode from '@/utils/editor/DroppedNode';
import EditorCommands from '@/utils/editor/EditorCommands';
import convertWorkflowData from '@/utils/convertWorkflowData';
import startRecordWorkflow from '@/newtab/utils/startRecordWorkflow';
import extractAutocopmleteData from '@/utils/editor/editorAutocomplete';
import WorkflowShare from '@/components/newtab/workflow/WorkflowShare.vue';
import WorkflowEditor from '@/components/newtab/workflow/WorkflowEditor.vue';
import WorkflowSettings from '@/components/newtab/workflow/WorkflowSettings.vue';
import WorkflowShareTeam from '@/components/newtab/workflow/WorkflowShareTeam.vue';
import WorkflowEditBlock from '@/components/newtab/workflow/WorkflowEditBlock.vue';
import WorkflowDataTable from '@/components/newtab/workflow/WorkflowDataTable.vue';
import WorkflowGlobalData from '@/components/newtab/workflow/WorkflowGlobalData.vue';
import WorkflowDetailsCard from '@/components/newtab/workflow/WorkflowDetailsCard.vue';
import SharedPermissionsModal from '@/components/newtab/shared/SharedPermissionsModal.vue';
import EditorAddPackage from '@/components/newtab/workflow/editor/EditorAddPackage.vue';
import EditorDebugging from '@/components/newtab/workflow/editor/EditorDebugging.vue';
import EditorPkgActions from '@/components/newtab/workflow/editor/EditorPkgActions.vue';
import EditorLocalCtxMenu from '@/components/newtab/workflow/editor/EditorLocalCtxMenu.vue';
import EditorLocalActions from '@/components/newtab/workflow/editor/EditorLocalActions.vue';
import EditorUsedCredentials from '@/components/newtab/workflow/editor/EditorUsedCredentials.vue';
import EditorLocalSavedBlocks from '@/components/newtab/workflow/editor/EditorLocalSavedBlocks.vue';
import PackageDetails from '@/components/newtab/package/PackageDetails.vue';
import PackageSettings from '@/components/newtab/package/PackageSettings.vue';

const blocks = getBlocks();

let editorCommands = null;
const executeCommandTimeout = null;
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 7);

useGroupTooltip();

const { t, te } = useI18n();
const toast = useToast();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const packageStore = usePackageStore();
const workflowStore = useWorkflowStore();
const commandManager = useCommandManager();
const teamWorkflowStore = useTeamWorkflowStore();

const { teamId, id: workflowId } = route.params;
const isTeamWorkflow = route.name === 'team-workflows';
const isPackage = route.name === 'packages-details';
const funcsAutocomplete = Object.keys(functions).reduce((acc, name) => {
  acc[`$${name}`] = '';

  return acc;
}, {});

const editor = shallowRef(null);
const connectedTable = shallowRef(null);

const state = reactive({
  showSidebar: true,
  sidebarState: true,
  dataChanged: false,
  animateBlocks: false,
  isExecuteCommand: false,
  workflowConverted: false,
  activeTab: route.query.tab || 'editor',
});
const blockFolderModal = reactive({
  name: '',
  icon: '',
  nodes: [],
  description: '',
  showList: false,
  showModal: false,
});
const permissionState = reactive({
  permissions: [],
  showModal: false,
});
const modalState = reactive({
  name: '',
  show: false,
});
const editState = reactive({
  blockData: {},
  editing: false,
});
const autocompleteState = reactive({
  blocks: {},
  common: {},
});
const workflowPayload = {
  data: {},
  isUpdating: false,
};

const workflowModals = {
  table: {
    icon: 'riKey2Line',
    width: 'max-w-2xl',
    component: WorkflowDataTable,
    title: t('workflow.table.title'),
    docs: 'https://docs.automa.site/workflow/table.html',
    events: {
      /* eslint-disable-next-line */
      connect: fetchConnectedTable,
      disconnect() {
        connectedTable.value = null;
      },
    },
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
        modalState.show = false;
        modalState.name = '';
      },
      publish() {
        modalState.show = false;
        modalState.name = '';
      },
    },
  },
  'workflow-share-team': {
    icon: 'riShareLine',
    component: WorkflowShareTeam,
    attrs: {
      blur: true,
      persist: true,
      customContent: true,
    },
    events: {
      close() {
        modalState.show = false;
        modalState.name = '';
      },
      publish() {
        modalState.show = false;
        modalState.name = '';
      },
    },
  },
  'global-data': {
    width: 'max-w-2xl',
    icon: 'riDatabase2Line',
    component: WorkflowGlobalData,
    title: t('common.globalData'),
    docs: 'https://docs.automa.site/workflow/global-data.html',
  },
  settings: {
    width: 'max-w-2xl',
    icon: 'riSettings3Line',
    component: WorkflowSettings,
    title: t('common.settings'),
    attrs: {
      customContent: true,
    },
    events: {
      close() {
        modalState.show = false;
        modalState.name = '';
      },
    },
  },
};

const autocompleteList = computed(() => {
  const autocompleteData = {
    loopData: {},
    googleSheets: {},
    table: {},
    ...funcsAutocomplete,
    globalData: autocompleteState.common.globalData,
    variables: { ...autocompleteState.common.variables },
  };

  Object.values(autocompleteState.blocks).forEach((item) => {
    if (item.loopData) Object.assign(autocompleteData.loopData, item.loopData);
    if (item.variables)
      Object.assign(autocompleteData.variables, item.variables);
    if (item.googleSheets)
      Object.assign(autocompleteData.googleSheets, item.googleSheets);
  });

  return autocompleteData;
});
const haveEditAccess = computed(() => {
  if (!isTeamWorkflow) return true;

  return userStore.validateTeamAccess(teamId, ['edit', 'owner', 'create']);
});
const workflow = computed(() => {
  if (isTeamWorkflow) {
    return teamWorkflowStore.getById(teamId, workflowId);
  }
  if (isPackage) {
    return packageStore.getById(workflowId);
  }

  return workflowStore.getById(workflowId);
});
const workflowStates = computed(() =>
  workflowStore.getWorkflowStates(route.params.id)
);
const activeWorkflowModal = computed(
  () => workflowModals[modalState.name] || {}
);
const workflowColumns = computed(() => {
  if (connectedTable.value) {
    return connectedTable.value.columns;
  }

  return workflow.value.table;
});
const editorData = computed(() => {
  if (isPackage) return workflow.value.data;

  return workflow.value.drawflow;
});

const updateBlockData = debounce((data) => {
  if (!haveEditAccess.value) return;
  const node = editor.value.getNode.value(editState.blockData.blockId);
  const dataCopy = JSON.parse(JSON.stringify(data));

  let autocompleteId = '';

  if (editState.blockData.itemId) {
    const itemIndex = node.data.blocks.findIndex(
      ({ itemId }) => itemId === editState.blockData.itemId
    );

    if (itemIndex !== -1) {
      node.data.blocks[itemIndex].data = dataCopy;
      autocompleteId = editState.blockData.itemId;
    }
  } else {
    node.data = dataCopy;
    autocompleteId = editState.blockData.blockId;
  }

  if (autocompleteState.blocks[autocompleteId]) {
    const { id, blockId } = editState.blockData;
    Object.assign(
      autocompleteState.blocks,
      /* eslint-disable-next-line */
      extractAutocopmleteData(id, { data, id: blockId })
    );
  }

  editState.blockData.data = data;
  state.dataChanged = true;
}, 250);
const updateHostedWorkflow = throttle(async () => {
  if (isTeamWorkflow) return;
  if (!userStore.user || workflowPayload.isUpdating) return;

  const isHosted = userStore.hostedWorkflows[route.params.id];
  const isBackup = userStore.backupIds?.includes(route.params.id);
  const workflowExist = workflowStore.getById(route.params.id);

  if (
    (!isBackup && !isHosted) ||
    !workflowExist ||
    Object.keys(workflowPayload.data).length === 0
  )
    return;

  workflowPayload.isUpdating = true;

  const delKeys = [
    'id',
    'pass',
    'logs',
    'trigger',
    'createdAt',
    'isDisabled',
    'isProtected',
  ];
  delKeys.forEach((key) => {
    delete workflowPayload.data[key];
  });

  try {
    if (typeof workflowPayload.data.drawflow === 'string') {
      workflowPayload.data.drawflow = parseJSON(
        workflowPayload.data.drawflow,
        workflowPayload.data.drawflow
      );
    }

    const response = await fetchApi(`/me/workflows/${route.params.id}`, {
      auth: true,
      method: 'PUT',
      keepalive: true,
      body: JSON.stringify({
        workflow: workflowPayload.data,
      }),
    });

    if (!response.ok) throw new Error(response.message);
    if (isBackup) {
      const result = await response.json();

      if (result.updatedAt) {
        await browser.storage.local.set({ lastBackup: result.updatedAt });
      }
    }

    workflowPayload.data = {};
    workflowPayload.isUpdating = false;
  } catch (error) {
    console.error(error);
    workflowPayload.isUpdating = false;
  }
}, 5000);
const onEdgesChange = debounce((changes) => {
  changes.forEach(({ type, item }) => {
    if (
      type === 'add' &&
      item.sourceHandle.includes('output') &&
      item.targetHandle.includes('output')
    ) {
      editor.value.removeEdges([item.id]);

      return;
    }

    if (state.dataChanged) return;
    state.dataChanged = type !== 'select';
  });
}, 250);

function onTabChange(tabVal) {
  if (tabVal === 'logs') {
    emitter.emit('ui:logs', {
      workflowId,
      show: true,
    });
    return;
  }

  state.activeTab = tabVal;
}
function onUpdateBlockSettings({ blockId, itemId, settings }) {
  state.dataChanged = true;

  if (!editState.editing) return;
  if (itemId && itemId !== editState.blockData.itemId) return;
  if (editState.blockData.blockId !== blockId) return;

  editState.blockData.data = { ...editState.blockData.data, ...settings };
}
function closeEditingCard() {
  editState.editing = false;
  editState.blockData = {};

  state.showSidebar = state.sidebarState;
}
async function executeFromBlock(blockId) {
  try {
    if (!blockId) return;

    const workflowOptions = { blockId };

    let tab = await getActiveTab();
    if (!tab) {
      [tab] = await browser.tabs.query({ active: true, url: '*://*/*' });
    }
    if (tab) {
      workflowOptions.tabId = tab.id;
    }

    executeWorkflow(workflow.value, workflowOptions);
  } catch (error) {
    console.error(error);
  }
}
function startRecording({ nodeId, handleId }) {
  if (state.dataChanged) {
    alert('Make sure to save the workflow before starting recording');
    return;
  }

  const options = {
    workflowId,
    name: workflow.value.name,
    connectFrom: {
      id: nodeId,
      output: handleId,
    },
  };
  startRecordWorkflow(options).then(() => {
    state.dataChanged = false;
    router.replace('/recording');
  });
}
function goToBlock(blockId) {
  if (!editor.value) return;

  const block = editor.value.getNode.value(blockId);
  if (!block) return;

  editor.value.addSelectedNodes([block]);
  setTimeout(() => {
    const editorContainer = document.querySelector('.vue-flow');
    const { height, width } = editorContainer.getBoundingClientRect();
    const { x, y } = block.position;

    editor.value.setTransform({
      y: -(y - height / 2),
      x: -(x - width / 2) - 200,
      zoom: 1,
    });
  }, 200);
}
function goToPkgBlock(blockId) {
  state.activeTab = 'editor';
  goToBlock(blockId);
}
function addPackageIO({ type, handleId, nodeId }) {
  const copyPkgIO = [...workflow.value[type]];
  const itemExist = copyPkgIO.some(
    (io) => io.blockId === nodeId && handleId === io.handleId
  );
  if (itemExist) {
    toast.error(`You already add this as an ${type.slice(0, -1)}`);
    return;
  }

  copyPkgIO.push({
    handleId,
    name: '',
    id: nanoid(),
    blockId: nodeId,
  });

  /* eslint-disable-next-line */
  updateWorkflow({ [type]: copyPkgIO });
}
function initBlockFolder({ nodes }) {
  Object.assign(blockFolderModal, {
    nodes,
    showModal: true,
  });
}
function clearBlockFolderModal() {
  Object.assign(blockFolderModal, {
    name: '',
    nodes: [],
    asBlock: false,
    description: '',
    showModal: false,
    icon: 'mdiPackageVariantClosed',
  });
}
async function saveBlockToFolder() {
  try {
    const seen = new Set();
    const nodeList = [
      ...editor.value.getSelectedNodes.value,
      ...blockFolderModal.nodes,
    ].reduce((acc, node) => {
      if (seen.has(node.id)) return acc;

      const { label, data, position, id, type } = node;
      acc.push(cloneDeep({ label, data, position, id, type }));
      seen.add(node.id);

      return acc;
    }, []);
    const edges = editor.value.getSelectedEdges.value.map(
      ({ source, target, targetHandle, sourceHandle, id }) =>
        cloneDeep({ id, source, target, targetHandle, sourceHandle })
    );

    packageStore.insert({
      data: { nodes: nodeList, edges },
      name: blockFolderModal.name || 'unnamed',
      description: blockFolderModal.description,
      asBlock: blockFolderModal?.asBlock ?? false,
      icon: blockFolderModal.icon || 'mdiPackageVariantClosed',
    });

    clearBlockFolderModal();
  } catch (error) {
    console.error(error);
  }
}
function groupBlocks({ position }) {
  const nodesToDelete = [];
  const nodes = editor.value.getSelectedNodes.value;
  const groupBlocksList = nodes.reduce((acc, node) => {
    if (excludeGroupBlocks.includes(node.label)) return acc;

    acc.push({
      id: node.label,
      itemId: node.id,
      data: node.data,
    });
    nodesToDelete.push(node);

    return acc;
  }, []);

  if (groupBlocksList.length === 0) return;

  editor.value.removeNodes(nodesToDelete);

  const { component, data } = blocks['blocks-group'];
  editor.value.addNodes([
    {
      id: nanoid(),
      type: component,
      label: 'blocks-group',
      data: { ...data, blocks: groupBlocksList },
      position: editor.value.project({
        x: position.clientX - 360,
        y: position.clientY,
      }),
    },
  ]);
}
function ungroupBlocks({ nodes }) {
  const [node] = nodes;
  if (!node || node.label !== 'blocks-group') return;

  const edges = [];
  const position = { ...node.position };
  const copyBlocks = cloneDeep(node.data?.blocks || []);
  const groupBlocksList = copyBlocks.map((item, index) => {
    const nextNode = copyBlocks[index + 1];
    if (nextNode) {
      edges.push({
        source: item.itemId,
        target: nextNode.itemId,
        sourceHandle: `${item.itemId}-output-1`,
        targetHandle: `${nextNode.itemId}-input-1`,
      });
    }

    item.label = item.id;
    item.id = item.itemId;
    item.position = { ...position };
    item.type = blocks[item.label].component;

    delete item.itemId;

    position.x += 250;

    return item;
  });

  editor.value.removeNodes(nodes);
  editor.value.addNodes(groupBlocksList);
  editor.value.addSelectedNodes(groupBlocksList);
  editor.value.addEdges(edges);
}
async function initAutocomplete() {
  const autocompleteCache = sessionStorage.getItem(
    `autocomplete:${workflowId}`
  );
  if (autocompleteCache) {
    const objData = parseJSON(autocompleteCache, {});
    autocompleteState.blocks = objData;
  } else {
    const autocompleteData = {};
    editorData.value.nodes.forEach(({ label, id, data }) => {
      Object.assign(
        autocompleteData,
        extractAutocopmleteData(label, { data, id })
      );
    });

    autocompleteState.blocks = autocompleteData;
  }

  try {
    const storageVars = await dbStorage.variables.toArray();
    autocompleteState.common.globalData = parseJSON(
      workflow.value.globalData,
      {}
    );
    autocompleteState.common.variables = {};

    storageVars.forEach((variable) => {
      autocompleteState.common.variables[`$$${variable.name}`] = {};
    });
  } catch (error) {
    console.error(error);
  }
}
function registerTrigger() {
  const triggerBlock = editorData.value.nodes.find(
    (node) => node.label === 'trigger'
  );
  registerWorkflowTrigger(workflowId, triggerBlock);
}
function executeCommand(type) {
  state.isExecuteCommand = true;

  if (type === 'undo') {
    commandManager.undo();
  } else if (type === 'redo') {
    commandManager.redo();
  }

  clearTimeout(executeCommandTimeout);
  setTimeout(() => {
    state.isExecuteCommand = false;
  }, 500);
}
function onNodesChange(changes) {
  const nodeChanges = { added: [], removed: [] };
  changes.forEach(({ type, id, item }) => {
    if (type === 'remove') {
      if (editState.blockData.blockId === id) {
        editState.editing = false;
        editState.blockData = {};
      }

      state.dataChanged = true;
      nodeChanges.removed.push(id);
    } else if (type === 'add') {
      if (isPackage) {
        const excludeBlocks = ['block-package', 'trigger', 'execute-workflow'];
        if (excludeBlocks.includes(item.label)) {
          editor.value.removeNodes([item]);
        }

        return;
      }

      nodeChanges.added.push(item);
    }
  });

  if (state.isExecuteCommand) return;

  let command = null;

  if (nodeChanges.added.length > 0) {
    command = editorCommands.nodeAdded(nodeChanges.added);
  } else if (nodeChanges.removed.length > 0) {
    command = editorCommands.nodeRemoved(nodeChanges.removed);
  }

  if (command) {
    commandManager.add(command);
  }
}
function autoAlign() {
  state.animateBlocks = true;

  const graph = new dagre.graphlib.Graph();
  graph.setGraph({
    rankdir: 'LR',
    ranksep: 100,
    ranker: 'tight-tree',
  });
  graph._isMultigraph = true;
  graph.setDefaultEdgeLabel(() => ({}));
  editor.value.getNodes.value.forEach(
    ({ id, label, dimensions, parentNode }) => {
      if (label === 'blocks-group-2' || parentNode) return;

      graph.setNode(id, {
        label,
        width: dimensions.width,
        height: dimensions.height,
      });
    }
  );
  editor.value.getEdges.value.forEach(({ source, target, id }) => {
    graph.setEdge(source, target, { id });
  });

  dagre.layout(graph);
  const nodeChanges = [];
  graph.nodes().forEach((nodeId) => {
    const graphNode = graph.node(nodeId);
    if (!graphNode) return;

    const { x, y } = graphNode;

    if (editorCommands.state.nodes[nodeId]) {
      editorCommands.state.nodes[nodeId].position = { x, y };
    }

    nodeChanges.push({
      id: nodeId,
      type: 'position',
      dragging: false,
      position: { x, y },
    });
  });

  editor.value.applyNodeChanges(nodeChanges);
  setTimeout(() => {
    editor.value.fitView();
  }, 0);

  setTimeout(() => {
    state.dataChanged = true;
    state.animateBlocks = false;
  }, 500);
}
async function snakeIt() {
  state.animateBlocks = true;

  const maxStepsPerRow = 4;
  const stepWidth = 300;
  const stepHeight = 150;
  let currentRow = 0;
  let currentCol = 0;

  const graph = new dagre.graphlib.Graph();
  graph.setGraph({
    rankdir: 'LR',
    ranksep: 100,
    ranker: 'tight-tree',
  });
  graph.setDefaultEdgeLabel(() => ({}));

  const nodes = editor.value.getNodes.value.filter(
    ({ label, parentNode }) => label !== 'blocks-group-2' && !parentNode
  );

  nodes.forEach(({ id, dimensions }) => {
    graph.setNode(id, {
      width: dimensions.width,
      height: dimensions.height,
    });
  });

  editor.value.getEdges.value.forEach(({ source, target, id }) => {
    graph.setEdge(source, target, { id });
  });

  const nodeChanges = nodes.map(({ id }) => {
    const x = currentCol * stepWidth;
    const y = currentRow * stepHeight;

    if (editorCommands.state.nodes[id]) {
      editorCommands.state.nodes[id].position = { x, y };
    }

    currentCol = (currentCol + 1) % maxStepsPerRow;
    if (currentCol === 0) currentRow += 1;

    return {
      id,
      type: 'position',
      dragging: false,
      position: { x, y },
    };
  });

  editor.value.applyNodeChanges(nodeChanges);

  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
  editor.value.fitView();

  await new Promise((resolve) => {
    setTimeout(resolve, 500);
  });
  state.dataChanged = true;
  state.animateBlocks = false;
}

function toggleSidebar() {
  state.showSidebar = !state.showSidebar;
  localStorage.setItem('workflow:sidebar', state.showSidebar);
}
function initEditBlock(data) {
  const { editComponent, data: blockDefData, name } = blocks[data.id];
  const blockData = defu(data.data, blockDefData);
  const blockEditComponent =
    typeof editComponent === 'string' ? editComponent : markRaw(editComponent);

  editState.blockData = {
    ...data,
    editComponent: blockEditComponent,
    name,
    data: blockData,
  };

  if (data.id === 'wait-connections') {
    const connections = editor.value.getEdges.value.reduce(
      (acc, { target, sourceNode, source }) => {
        if (target !== data.blockId) return acc;

        const blockNameKey = `workflow.blocks.${sourceNode.label}.name`;
        let blockName = te(blockNameKey)
          ? t(blockNameKey)
          : blocks[sourceNode.label].name;

        const { description, name: groupName } = sourceNode.data;
        if (description || groupName)
          blockName += ` (${description || groupName})`;

        acc.push({
          id: source,
          name: blockName,
        });

        return acc;
      },
      []
    );

    editState.blockData.connections = connections;
  }

  state.showSidebar = true;
  editState.editing = true;
}
async function updateWorkflow(data) {
  try {
    if (isPackage) {
      if (workflow.value.isExternal) return;

      delete data.drawflow;
      await packageStore.update({
        id: workflowId,
        data,
      });
      return;
    }

    if (isTeamWorkflow) {
      if (!haveEditAccess.value && !data.globalData) return;
      await teamWorkflowStore.update({
        data,
        teamId,
        id: workflowId,
      });
    } else {
      await workflowStore.update({
        data,
        id: route.params.id,
      });
    }

    workflowPayload.data = { ...workflowPayload.data, ...data };

    if (!isTeamWorkflow) await updateHostedWorkflow();
  } catch (error) {
    console.error(error);
  }
}
function onActionUpdated({ data, changedIndicator }) {
  state.dataChanged = changedIndicator;

  workflowPayload.data = { ...workflowPayload.data, ...data };
  if (!isPackage) updateHostedWorkflow();
}
function onEditorInit(instance) {
  editor.value = instance;

  let nodeToConnect = null;

  instance.onEdgesChange(onEdgesChange);
  instance.onNodesChange(onNodesChange);
  instance.onEdgeDoubleClick(({ edge }) => {
    instance.removeEdges([edge]);
  });
  instance.onConnectStart(({ nodeId, handleId, handleType }) => {
    if (handleType !== 'source') return;

    nodeToConnect = { nodeId, handleId };
  });
  instance.onConnectEnd(({ target }) => {
    if (!nodeToConnect) return;

    if (target.hasAttribute('data-handleid')) {
      const handleId = target.getAttribute('data-handleid');
      if (handleId.includes('-output-')) return;
    }

    const isNotTargetHandle = !target.closest('.vue-flow__handle.target');
    const targetNode = isNotTargetHandle && target.closest('.vue-flow__node');

    if (targetNode && targetNode.dataset.id !== nodeToConnect.nodeId) {
      const nodeId = targetNode.dataset.id;
      const nodeData = editor.value.getNode.value(nodeId);

      if (nodeData && nodeData.handleBounds.target.length >= 1) {
        const targetHandle = nodeData.handleBounds.target.find(
          (item) => item.id
        );
        if (!targetHandle) return;

        editor.value.addEdges([
          {
            target: nodeId,
            source: nodeToConnect.nodeId,
            targetHandle: targetHandle.id,
            sourceHandle: nodeToConnect.handleId,
          },
        ]);
      }
    }

    nodeToConnect = null;
  });
  // instance.onEdgeUpdateEnd(({ edge }) => {
  //   editorCommands.state.edges[edge.id] = edge;
  // });

  instance.onNodeDragStop(({ nodes }) => {
    if (!editorCommands?.state?.nodes) return;

    nodes.forEach((node) => {
      editorCommands.state.nodes[node.id] = node;
    });
  });

  const convertToObj = (array) =>
    array.reduce((acc, item) => {
      acc[item.id] = item;

      return acc;
    }, {});
  setTimeout(() => {
    const commandInitState = {
      nodes: convertToObj(instance.getNodes.value),
      edges: convertToObj(instance.getEdges.value),
    };
    editorCommands = new EditorCommands(instance, commandInitState);
  }, 1000);

  const { blockId } = route.query;
  if (blockId) goToBlock(blockId);
}
function clearHighlightedElements() {
  const elements = document.querySelectorAll(
    '.dropable-area__node, .dropable-area__handle'
  );
  elements.forEach((element) => {
    element.classList.remove('dropable-area__node');
    element.classList.remove('dropable-area__handle');
  });
}
function toggleHighlightElement({ target, elClass, classes }) {
  const targetEl = target.closest(elClass);

  if (targetEl) {
    targetEl.classList.add(classes);
  } else {
    const elements = document.querySelectorAll(`.${classes}`);
    elements.forEach((element) => {
      element.classList.remove(classes);
    });
  }
}
function onDragoverEditor({ target }) {
  toggleHighlightElement({
    target,
    elClass: '.vue-flow__handle.source',
    classes: 'dropable-area__handle',
  });

  if (!target.closest('.vue-flow__handle')) {
    toggleHighlightElement({
      target,
      elClass: '.vue-flow__node:not(.vue-flow__node-BlockGroup)',
      classes: 'dropable-area__node',
    });
  }
}
function onDropInEditor({ dataTransfer, clientX, clientY, target }) {
  const savedBlocks = parseJSON(dataTransfer.getData('savedBlocks'), null);

  const editorRect = editor.value.viewportRef.value.getBoundingClientRect();
  const position = editor.value.project({
    y: clientY - editorRect.top,
    x: clientX - editorRect.left,
  });

  if (savedBlocks && !isPackage) {
    if (savedBlocks.settings.asBlock) {
      editor.value.addNodes([
        {
          position,
          id: nanoid(),
          data: savedBlocks,
          type: 'BlockPackage',
          label: 'block-package',
        },
      ]);
    } else {
      const { nodes, edges } = savedBlocks.data;
      /* eslint-disable-next-line */
      const newElements = copyElements(nodes, edges, { clientX, clientY });

      editor.value.addNodes(newElements.nodes);
      editor.value.addEdges(newElements.edges);
    }

    state.dataChanged = true;
    return;
  }

  const block = parseJSON(dataTransfer.getData('block'), null);
  if (!block || block.fromBlockBasic) return;

  if (block.id === 'trigger' && isPackage) return;

  clearHighlightedElements();

  const isTriggerExists =
    block.id === 'trigger' &&
    editor.value.getNodes.value.some((node) => node.label === 'trigger');
  if (isTriggerExists) return;

  const nodeEl = DroppedNode.isNode(target);
  if (nodeEl) {
    DroppedNode.replaceNode(editor.value, { block, target: nodeEl });
    return;
  }

  const nodeId = nanoid();
  const newNode = {
    position,
    label: block.id,
    data: block.data,
    type: block.component,
    id: block.id === 'blocks-group-2' ? `group-${nodeId}` : nodeId,
  };
  editor.value.addNodes([newNode]);

  const edgeEl = DroppedNode.isEdge(target);
  const handleEl = DroppedNode.isHandle(target);

  if (handleEl) {
    DroppedNode.appendNode(editor.value, {
      target: handleEl,
      nodeId: newNode.id,
    });
  } else if (edgeEl) {
    DroppedNode.insertBetweenNode(editor.value, {
      target: edgeEl,
      nodeId: newNode.id,
      outputs: block.outputs,
    });
  }

  if (block.fromGroup) {
    setTimeout(() => {
      const blockEl = document.querySelector(`[data-id="${newNode.id}"]`);
      blockEl?.setAttribute('group-item-id', block.itemId);
    }, 200);
  }

  state.dataChanged = true;
}
function copyElements(nodes, edges, initialPos) {
  const newIds = new Map();
  let firstNodePos = null;

  const newNodes = nodes.map(({ id, label, position, data, type }, index) => {
    const newNodeId = nanoid();

    const nodePos = {
      z: position.z || 0,
      y: position.y + 50,
      x: position.x + 50,
    };
    newIds.set(id, newNodeId);

    if (initialPos) {
      if (index === 0) {
        firstNodePos = {
          x: nodePos.x,
          y: nodePos.y,
        };
        initialPos = editor.value.project({
          y: initialPos.clientY,
          x: initialPos.clientX - 360,
        });

        Object.assign(nodePos, initialPos);
      } else {
        const xDistance = nodePos.x - firstNodePos.x;
        const yDistance = nodePos.y - firstNodePos.y;

        nodePos.x = initialPos.x + xDistance;
        nodePos.y = initialPos.y + yDistance;
      }
    }

    const copyNode = cloneDeep({
      data,
      label,
      id: newNodeId,
      selected: true,
      position: nodePos,
      type: type || blocks[label].component,
    });
    copyNode.data = reactive(copyNode.data);

    return copyNode;
  });
  const newEdges = edges.reduce(
    (acc, { target, targetHandle, source, sourceHandle }) => {
      const targetId = newIds.get(target);
      const sourceId = newIds.get(source);

      if (!targetId || !sourceId) return acc;

      const copyEdge = cloneDeep({
        selected: true,
        target: targetId,
        source: sourceId,
        id: `edge-${nanoid()}`,
        targetHandle: targetHandle.replace(target, targetId),
        sourceHandle: sourceHandle.replace(source, sourceId),
      });
      acc.push(copyEdge);

      return acc;
    },
    []
  );

  return {
    nodes: newNodes,
    edges: newEdges,
  };
}
function duplicateElements({ nodes, edges }) {
  const selectedNodes = editor.value.getSelectedNodes.value;
  const selectedEdges = editor.value.getSelectedEdges.value;

  const { edges: newEdges, nodes: newNodes } = copyElements(
    nodes || selectedNodes,
    edges || selectedEdges
  );

  selectedNodes.forEach((node) => {
    node.selected = false;
  });
  selectedEdges.forEach((edge) => {
    edge.selected = false;
  });

  editor.value.addNodes(newNodes);
  editor.value.addEdges(newEdges);

  state.dataChanged = true;
}
function copySelectedElements(data = {}) {
  const nodes = data.nodes || editor.value.getSelectedNodes.value;
  const edges = data.edges || editor.value.getSelectedEdges.value;

  const clipboardData = JSON.stringify({
    name: 'automa-blocks',
    data: { nodes, edges },
  });
  navigator.clipboard.writeText(clipboardData).catch((error) => {
    console.error(error);
  });
}
async function pasteCopiedElements(position) {
  editor.value.removeSelectedNodes(editor.value.getSelectedNodes.value);
  editor.value.removeSelectedEdges(editor.value.getSelectedEdges.value);

  const permission = await browser.permissions.request({
    permissions: ['clipboardRead'],
  });
  if (!permission) {
    toast.error('Automa require clipboard permission to paste blocks');
    return;
  }

  try {
    const copiedText = await navigator.clipboard.readText();
    const workflowBlocks = parseJSON(copiedText);

    if (workflowBlocks && workflowBlocks.name === 'automa-blocks') {
      const { nodes, edges } = copyElements(
        workflowBlocks.data.nodes,
        workflowBlocks.data.edges,
        position
      );
      editor.value.addNodes(nodes);
      editor.value.addEdges(edges);

      state.dataChanged = true;
    }
  } catch (error) {
    console.error(error);
  }
}
function undoRedoCommand(type, { target }) {
  const els = ['INPUT', 'SELECT', 'TEXTAREA'];
  if (els.includes(target.tagName) || target.isContentEditable) return;

  executeCommand(type);
}
function onKeydown({ ctrlKey, metaKey, shiftKey, key, target, repeat }) {
  if (repeat) return;

  const els = ['INPUT', 'SELECT', 'TEXTAREA'];
  if (
    els.includes(target.tagName) ||
    target.isContentEditable ||
    !target.closest('.workflow-editor')
  )
    return;

  if (isPackage && workflow.value.isExternal) return;

  const command = (keyName) => (ctrlKey || metaKey) && keyName === key;
  if (command('c')) {
    copySelectedElements();
  } else if (command('v')) {
    pasteCopiedElements();
  } else if (command('z')) {
    undoRedoCommand(shiftKey ? 'redo' : 'undo', { target });
  }
}
async function fetchConnectedTable() {
  const table = await dbStorage.tablesItems
    .where('id')
    .equals(workflow.value.connectedTable)
    .first();
  if (!table) return;

  connectedTable.value = table;
}
function checkWorkflowPermission() {
  getWorkflowPermissions(editorData.value).then((permissions) => {
    if (permissions.length === 0) return;

    permissionState.items = permissions;
    permissionState.showModal = true;
  });
}
function checkWorkflowUpdate() {
  const updatedAt = encodeURIComponent(workflow.value.updatedAt);
  fetchApi(
    `/teams/${teamId}/workflows/${workflowId}/check-update?updatedAt=${updatedAt}`,
    { auth: true }
  )
    .then((response) => response.json())
    .then((result) => {
      if (!result) return;

      updateWorkflow(result).then(() => {
        editor.value.setNodes(result.drawflow.nodes || []);
        editor.value.setEdges(result.drawflow.edges || []);
        editor.value.fitView();
      });
    })
    .catch((error) => {
      console.error(error);
    });
}
/* eslint-disable consistent-return */
function onBeforeLeave() {
  // disselect node before leave
  const selectedNodes = editor.value?.getSelectedNodes?.value;
  selectedNodes?.forEach((node) => {
    node.selected = false;
  });

  updateHostedWorkflow();

  const dataNotChanged = !state.dataChanged || !haveEditAccess.value;
  const isExternalPkg = isPackage && workflow.value.isExternal;
  if (dataNotChanged || isExternalPkg) return;

  const confirm = window.confirm(t('message.notSaved'));

  if (!confirm) return false;
}

useHead({
  title: () =>
    `${workflow.value?.name} ${isPackage ? 'package' : 'workflow'}` || 'Automa',
});
const shortcut = useShortcut([
  getShortcut('editor:toggle-sidebar', toggleSidebar),
  getShortcut('editor:duplicate-block', duplicateElements),
]);

provide('workflow-editor', editor);
provide('autocompleteData', autocompleteList);
provide('workflow', {
  editState,
  isPackage,
  data: workflow,
  columns: workflowColumns,
});
provide('workflow-utils', {
  executeFromBlock,
});

watch(
  () => state.activeTab,
  (value) => {
    router.replace({ ...route, query: { tab: value } });
  }
);
watch(
  () => state.dataChanged,
  (isDataChanged) => {
    window.isDataChanged = isDataChanged && haveEditAccess.value;
  }
);

onDeactivated(() => {
  const selectedNodes = editor.value?.getSelectedNodes?.value;
  selectedNodes?.forEach((node) => {
    node.selected = false;
  });
});
onBeforeRouteLeave(onBeforeLeave);
onMounted(() => {
  if (!workflow.value) {
    router.replace(isPackage ? '/packages' : '/');
    return null;
  }

  const sidebarState =
    JSON.parse(localStorage.getItem('workflow:sidebar')) ?? true;
  state.showSidebar = sidebarState;
  state.sidebarState = sidebarState;

  if (!isPackage) {
    const convertedData = convertWorkflowData(workflow.value);
    updateWorkflow({ drawflow: convertedData.drawflow }).then(() => {
      state.workflowConverted = true;
    });
  } else {
    state.workflowConverted = true;
  }

  if (route.query.permission || (isTeamWorkflow && !haveEditAccess.value))
    checkWorkflowPermission();

  if (isTeamWorkflow && !haveEditAccess.value && workflow.value.updatedAt) {
    checkWorkflowUpdate();
  }

  if (workflow.value.connectedTable) {
    fetchConnectedTable();
  }

  initAutocomplete();
});
onBeforeUnmount(() => {
  if (isPackage && workflow.value.isExternal) return;
  updateHostedWorkflow();
});
</script>
<style>
.vue-flow,
.editor-tab {
  width: 100%;
  height: 100%;
}
.vue-flow__node {
  @apply rounded-lg;
}
.dropable-area__node,
.dropable-area__handle {
  @apply ring-4;
}
.animate-blocks {
  .vue-flow__transformationpane,
  .vue-flow__node {
    transition: transform 300ms ease;
  }
}
.undo-redo {
  button:not(:disabled):hover {
    @apply bg-box-transparent;
  }
  button:disabled {
    @apply text-gray-500 dark:text-gray-400;
  }
}
</style>

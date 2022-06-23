<template>
  <div v-if="workflow" class="flex h-screen">
    <div
      v-if="state.showSidebar"
      class="w-80 bg-white dark:bg-gray-800 py-6 relative border-l border-gray-100 dark:border-gray-700 dark:border-opacity-50 flex flex-col"
    >
      <workflow-edit-block
        v-if="editState.editing"
        v-model:autocomplete="autocompleteState.cache"
        :data="editState.blockData"
        :data-changed="autocompleteState.dataChanged"
        :workflow="workflow"
        :editor="editor"
        @update="updateBlockData"
        @close="(editState.editing = false), (editState.blockData = {})"
      />
      <workflow-details-card
        v-else
        :workflow="workflow"
        @update="updateWorkflow"
      />
    </div>
    <div class="flex-1 relative overflow-auto">
      <div
        class="absolute w-full flex items-center z-10 left-0 p-4 top-0 pointer-events-none"
      >
        <ui-tabs
          v-model="state.activeTab"
          class="border-none px-2 rounded-lg h-full space-x-1 bg-white dark:bg-gray-800 pointer-events-auto"
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
          <ui-tab value="logs" class="flex items-center">
            {{ t('common.log', 2) }}
            <span
              v-if="workflowStore.states.length > 0"
              class="ml-2 p-1 text-center inline-block text-xs rounded-full bg-accent text-white dark:text-black"
              style="min-width: 25px"
            >
              {{ workflowStore.states.length }}
            </span>
          </ui-tab>
        </ui-tabs>
        <div class="flex-grow pointer-events-none" />
        <editor-local-actions
          :editor="editor"
          :workflow="workflow"
          :is-data-changed="state.dataChanged"
          @save="state.dataChanged = false"
          @modal="(modalState.name = $event), (modalState.show = true)"
        />
      </div>
      <ui-tab-panels
        v-model="state.activeTab"
        class="overflow-hidden h-full w-full"
        @drop="onDropInEditor"
        @dragend="clearHighlightedElements"
        @dragover.prevent="onDragoverEditor"
      >
        <ui-tab-panel cache value="editor" class="w-full">
          <workflow-editor
            v-if="state.workflowConverted"
            :id="route.params.id"
            :data="workflow.drawflow"
            class="h-screen"
            @init="onEditorInit"
            @edit="initEditBlock"
            @update:node="state.dataChanged = true"
            @delete:node="state.dataChanged = true"
          />
        </ui-tab-panel>
        <ui-tab-panel value="logs" class="mt-24">
          <editor-logs
            :workflow-id="route.params.id"
            :workflow-states="workflowStore.states"
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
</template>
<script setup>
import {
  reactive,
  computed,
  onMounted,
  shallowRef,
  onBeforeUnmount,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { customAlphabet } from 'nanoid';
import { useUserStore } from '@/stores/user';
import { useWorkflowStore } from '@/stores/workflow';
import { useShortcut } from '@/composable/shortcut';
import { tasks } from '@/utils/shared';
import { debounce, parseJSON, throttle } from '@/utils/helper';
import { fetchApi } from '@/utils/api';
import EditorUtils from '@/utils/EditorUtils';
import convertWorkflowData from '@/utils/convertWorkflowData';
import WorkflowShare from '@/components/newtab/workflow/WorkflowShare.vue';
import WorkflowEditor from '@/components/newtab/workflow/WorkflowEditor.vue';
import WorkflowSettings from '@/components/newtab/workflow/WorkflowSettings.vue';
import WorkflowEditBlock from '@/components/newtab/workflow/WorkflowEditBlock.vue';
import WorkflowDataTable from '@/components/newtab/workflow/WorkflowDataTable.vue';
import WorkflowGlobalData from '@/components/newtab/workflow/WorkflowGlobalData.vue';
import WorkflowDetailsCard from '@/components/newtab/workflow/WorkflowDetailsCard.vue';
import EditorLogs from '@/components/newtab/workflow/editor/EditorLogs.vue';
import EditorLocalActions from '@/components/newtab/workflow/editor/EditorLocalActions.vue';

const nanoid = customAlphabet('1234567890abcdef', 7);

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const workflowStore = useWorkflowStore();
/* eslint-disable-next-line */
const shortcut = useShortcut('editor:toggle-sidebar', toggleSidebar);

const editor = shallowRef(null);

const state = reactive({
  showSidebar: true,
  dataChanged: false,
  workflowConverted: false,
  activeTab: route.query.tab || 'editor',
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
  cache: new Map(),
  dataChanged: false,
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
    docs: 'https://docs.automa.site/api-reference/table.html',
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
  'global-data': {
    width: 'max-w-2xl',
    icon: 'riDatabase2Line',
    component: WorkflowGlobalData,
    title: t('common.globalData'),
    docs: 'https://docs.automa.site/api-reference/global-data.html',
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

const workflow = computed(() =>
  workflowStore.getById('local', route.params.id)
);
const activeWorkflowModal = computed(
  () => workflowModals[modalState.name] || {}
);

const updateBlockData = debounce((data) => {
  const node = editor.value.getNode.value(editState.blockData.blockId);
  node.data = data;
  state.dataChanged = true;
  // let payload = data;

  // state.blockData.data = data;
  // state.dataChange = true;
  // autocomplete.dataChanged = true;

  // if (state.blockData.isInGroup) {
  //   payload = { itemId: state.blockData.itemId, data };
  // } else {
  //   editor.value.updateNodeDataFromId(state.blockData.blockId, data);
  // }

  // const inputEl = document.querySelector(
  //   `#node-${state.blockData.blockId} input.trigger`
  // );

  // if (inputEl)
  //   inputEl.dispatchEvent(
  //     new CustomEvent('change', { detail: toRaw(payload) })
  //   );
}, 250);
const updateHostedWorkflow = throttle(async () => {
  if (!userStore.user || workflowPayload.isUpdating) return;

  const isHosted = workflowStore.userHosted[route.param.id];
  const isBackup = (userStore.backupIds || []).includes(route.params.id);
  const isExists = Boolean(workflow.value);

  if (
    (!isBackup && !isHosted) ||
    !isExists ||
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

function toggleSidebar() {
  state.showSidebar = !state.showSidebar;
  localStorage.setItem('workflow:sidebar', state.showSidebar);
}
function initEditBlock(data) {
  const { editComponent } = tasks[data.id];

  editState.editing = true;
  editState.blockData = { ...data, editComponent };
}
function updateWorkflow(data) {
  workflowStore.updateWorkflow({
    data,
    location: 'local',
    id: route.params.id,
  });
  workflowPayload.data = { ...workflowPayload.data, ...data };
}
function onEditorInit(instance) {
  editor.value = instance;
  // listen to change event
  instance.onEdgesChange(() => {
    state.dataChanged = true;
  });
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
  const block = parseJSON(dataTransfer.getData('block'), null);
  if (!block) return;

  clearHighlightedElements();

  const nodeEl = EditorUtils.isNode(target);
  if (nodeEl) {
    EditorUtils.replaceNode(editor.value, { block, target: nodeEl });
    return;
  }

  const isTriggerExists =
    block.id === 'trigger' &&
    editor.value.getNodes.value.some((node) => node.label === 'trigger');
  if (isTriggerExists) return;

  const position = editor.value.project({ x: clientX - 360, y: clientY - 18 });
  const newNode = {
    position,
    id: nanoid(),
    label: block.id,
    data: block.data,
    type: block.component,
  };
  editor.value.addNodes([newNode]);

  const edgeEl = EditorUtils.isEdge(target);
  const handleEl = EditorUtils.isHandle(target);

  if (handleEl) {
    EditorUtils.appendNode(editor.value, {
      target: handleEl,
      nodeId: newNode.id,
    });
  } else if (edgeEl) {
    EditorUtils.insertBetweenNode(editor.value, {
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
/* eslint-disable consistent-return */
onBeforeRouteLeave(() => {
  updateHostedWorkflow();

  if (!state.dataChange) return;

  const confirm = window.confirm(t('message.notSaved'));

  if (!confirm) return false;
});
onMounted(() => {
  if (!workflow.value) {
    router.replace('/');
    return null;
  }

  state.showSidebar =
    JSON.parse(localStorage.getItem('workflow:sidebar')) ?? true;

  const convertedData = convertWorkflowData(workflow.value);
  updateWorkflow({ drawflow: convertedData.drawflow });
  state.workflowConverted = true;

  window.onbeforeunload = () => {
    updateHostedWorkflow();

    if (state.dataChange) {
      return t('message.notSaved');
    }
    return true;
  };
});
onBeforeUnmount(() => {
  window.onbeforeunload = null;
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
</style>

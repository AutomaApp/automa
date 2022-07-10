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
              v-if="workflowStates.length > 0"
              class="ml-2 p-1 text-center inline-block text-xs rounded-full bg-accent text-white dark:text-black"
              style="min-width: 25px"
            >
              {{ workflowStates.length }}
            </span>
          </ui-tab>
        </ui-tabs>
        <div class="flex-grow pointer-events-none" />
        <editor-local-actions
          :editor="editor"
          :workflow="workflow"
          :is-data-changed="state.dataChanged"
          @update="onActionUpdated"
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
            :class="{ 'animate-blocks': state.animateBlocks }"
            class="h-screen"
            @init="onEditorInit"
            @edit="initEditBlock"
            @update:node="state.dataChanged = true"
            @delete:node="state.dataChanged = true"
          >
            <template #controls-append>
              <button
                v-tooltip="t('workflow.autoAlign.title')"
                class="control-button hoverable ml-2"
                @click="autoAlign"
              >
                <v-remixicon name="riMagicLine" />
              </button>
              <ui-card padding="p-0 ml-2 undo-redo">
                <button
                  v-tooltip.group="
                    `${t('workflow.undo')} (${
                      shortcut['action:undo'].readable
                    })`
                  "
                  :disabled="!commandManager.state.value.canUndo"
                  class="p-2 rounded-lg transition-colors"
                  @click="executeCommand('undo')"
                >
                  <v-remixicon name="riArrowGoBackLine" />
                </button>
                <button
                  v-tooltip.group="
                    `${t('workflow.redo')} (${
                      shortcut['action:redo'].readable
                    })`
                  "
                  :disabled="!commandManager.state.value.canRedo"
                  class="p-2 rounded-lg transition-colors"
                  @click="executeCommand('redo')"
                >
                  <v-remixicon name="riArrowGoForwardLine" />
                </button>
              </ui-card>
            </template>
          </workflow-editor>
          <editor-local-ctx-menu
            v-if="editor"
            :editor="editor"
            @copy="copySelectedElements"
            @paste="pasteCopiedElements"
            @duplicate="duplicateElements"
          />
        </ui-tab-panel>
        <ui-tab-panel value="logs" class="mt-24 container">
          <editor-logs
            :workflow-id="route.params.id"
            :workflow-states="workflowStates"
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
  />
</template>
<script setup>
import {
  watch,
  provide,
  reactive,
  computed,
  onMounted,
  shallowRef,
  onBeforeUnmount,
} from 'vue';
import cloneDeep from 'lodash.clonedeep';
import { getNodesInside } from '@braks/vue-flow';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { customAlphabet } from 'nanoid';
import defu from 'defu';
import dagre from 'dagre';
import { useStore } from '@/stores/main';
import { useUserStore } from '@/stores/user';
import { useWorkflowStore } from '@/stores/workflow';
import { useShortcut, getShortcut } from '@/composable/shortcut';
import { getWorkflowPermissions } from '@/utils/workflowData';
import { tasks } from '@/utils/shared';
import { fetchApi } from '@/utils/api';
import { useGroupTooltip } from '@/composable/groupTooltip';
import { useCommandManager } from '@/composable/commandManager';
import { debounce, parseJSON, throttle } from '@/utils/helper';
import browser from 'webextension-polyfill';
import dbStorage from '@/db/storage';
import DroppedNode from '@/utils/editor/DroppedNode';
import EditorCommands from '@/utils/editor/EditorCommands';
import convertWorkflowData from '@/utils/convertWorkflowData';
import WorkflowShare from '@/components/newtab/workflow/WorkflowShare.vue';
import WorkflowEditor from '@/components/newtab/workflow/WorkflowEditor.vue';
import WorkflowSettings from '@/components/newtab/workflow/WorkflowSettings.vue';
import WorkflowEditBlock from '@/components/newtab/workflow/WorkflowEditBlock.vue';
import WorkflowDataTable from '@/components/newtab/workflow/WorkflowDataTable.vue';
import WorkflowGlobalData from '@/components/newtab/workflow/WorkflowGlobalData.vue';
import WorkflowDetailsCard from '@/components/newtab/workflow/WorkflowDetailsCard.vue';
import EditorLogs from '@/components/newtab/workflow/editor/EditorLogs.vue';
import SharedPermissionsModal from '@/components/newtab/shared/SharedPermissionsModal.vue';
import EditorLocalCtxMenu from '@/components/newtab/workflow/editor/EditorLocalCtxMenu.vue';
import EditorLocalActions from '@/components/newtab/workflow/editor/EditorLocalActions.vue';

let editorCommands = null;
const executeCommandTimeout = null;
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 7);

useGroupTooltip();

const { t } = useI18n();
const store = useStore();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const workflowStore = useWorkflowStore();
const commandManager = useCommandManager();

const editor = shallowRef(null);
const connectedTable = shallowRef(null);

const state = reactive({
  showSidebar: true,
  dataChanged: false,
  animateBlocks: false,
  isExecuteCommand: false,
  workflowConverted: false,
  activeTab: route.query.tab || 'editor',
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

const workflow = computed(() => workflowStore.getById(route.params.id));
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

provide('workflow', {
  editState,
  data: workflow,
  columns: workflowColumns,
});
provide('workflow-editor', editor);

const updateBlockData = debounce((data) => {
  const node = editor.value.getNode.value(editState.blockData.blockId);
  const dataCopy = JSON.parse(JSON.stringify(data));

  if (editState.blockData.itemId) {
    const itemIndex = node.data.blocks.findIndex(
      ({ itemId }) => itemId === editState.blockData.itemId
    );
    if (itemIndex === -1) return;

    node.data.blocks[itemIndex].data = dataCopy;
  } else {
    node.data = dataCopy;
  }

  editState.blockData.data = data;
  state.dataChanged = true;
}, 250);
const updateHostedWorkflow = throttle(async () => {
  if (!userStore.user || workflowPayload.isUpdating) return;

  const isHosted = userStore.hostedWorkflows[route.params.id];
  const isBackup = userStore.backupIds.includes(route.params.id);
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
  // const edgeChanges = { added: [], removed: [] };

  changes.forEach(({ type }) => {
    // if (type === 'remove') {
    //   edgeChanges.removed.push(id);
    // } else if (type === 'add') {
    //   edgeChanges.added.push(item);
    // }

    if (state.dataChanged) return;
    state.dataChanged = type !== 'select';
  });

  // if (state.isExecuteCommand) return;

  // let command = null;

  // if (edgeChanges.added.length > 0) {
  //   command = editorCommands.edgeAdded(edgeChanges.added);
  // } else if (edgeChanges.removed.length > 0) {
  //   command = editorCommands.edgeRemoved(edgeChanges.removed);
  // }

  // if (command) commandManager.add(command);
}, 250);

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
  editor.value.fitView();

  setTimeout(() => {
    state.dataChanged = true;
    state.animateBlocks = false;
  }, 500);
}
function toggleSidebar() {
  state.showSidebar = !state.showSidebar;
  localStorage.setItem('workflow:sidebar', state.showSidebar);
}
function initEditBlock(data) {
  const { editComponent, data: blockDefData } = tasks[data.id];
  const blockData = defu(data.data, blockDefData);

  editState.blockData = { ...data, editComponent, data: blockData };

  if (data.id === 'wait-connections') {
    const connections = editor.value.getEdges.value.reduce(
      (acc, { target, sourceNode, source }) => {
        if (target !== data.blockId) return acc;

        let name = t(`workflow.blocks.${sourceNode.label}.name`);

        const { description } = sourceNode.data;
        if (description) name += ` (${description})`;

        acc.push({
          name,
          id: source,
        });

        return acc;
      },
      []
    );

    editState.blockData.connections = connections;
  }

  editState.editing = true;
}
async function updateWorkflow(data) {
  try {
    await workflowStore.update({
      data,
      id: route.params.id,
    });
    workflowPayload.data = { ...workflowPayload.data, ...data };
    await updateHostedWorkflow();
  } catch (error) {
    console.error(error);
  }
}
function onActionUpdated({ data, changedIndicator }) {
  state.dataChanged = changedIndicator;
  workflowPayload.data = { ...workflowPayload.data, ...data };
  updateHostedWorkflow();
}
function isNodesInGroup(nodes) {
  const groupNodes = editor.value.getNodes.value.filter(
    (node) => node.label === 'blocks-group-2'
  );

  const nodeInGroup = new Set();
  const filteredNodes = nodes.filter((node) => node.label !== 'blocks-group-2');

  groupNodes.forEach(({ computedPosition, dimensions, id }) => {
    const rect = { ...computedPosition, ...dimensions };
    const nodesInGroup = getNodesInside(filteredNodes, rect);

    nodesInGroup.forEach((node) => {
      state.dataChanged = true;

      if (node.parentNode === id) {
        nodeInGroup.add(node.id);
        return;
      }

      nodeInGroup.add(node.id);

      const currentNode = editor.value.getNode.value(node.id);
      currentNode.parentNode = id;
      currentNode.position.x -= 450;
    });
  });
  filteredNodes.forEach((node) => {
    if (nodeInGroup.has(node.id)) return;

    const currentNode = editor.value.getNode.value(node.id);
    if (!currentNode.parentNode) return;

    currentNode.parentNode = undefined;
  });
}
function onEditorInit(instance) {
  editor.value = instance;

  instance.onEdgesChange(onEdgesChange);
  instance.onNodesChange(onNodesChange);
  instance.onEdgeDoubleClick(({ edge }) => {
    instance.removeEdges([edge]);
  });
  // instance.onEdgeUpdateEnd(({ edge }) => {
  //   editorCommands.state.edges[edge.id] = edge;
  // });

  instance.onNodeDragStop(({ nodes }) => {
    isNodesInGroup(nodes);

    nodes.forEach((node) => {
      editorCommands.state.nodes[node.id] = node;
    });
  });

  instance.removeSelectedNodes(
    instance.getSelectedNodes.value.map(({ id }) => id)
  );
  instance.removeSelectedEdges(
    instance.getSelectedEdges.value.map(({ id }) => id)
  );

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
  if (blockId) {
    const block = instance.getNode.value(blockId);
    if (!block) return;

    instance.addSelectedNodes([block]);
    setTimeout(() => {
      const editorContainer = document.querySelector('.vue-flow');
      const { height, width } = editorContainer.getBoundingClientRect();
      const { x, y } = block.position;

      instance.setTransform({
        y: -(y - height / 2),
        x: -(x - width / 2) - 200,
        zoom: 1,
      });
    }, 200);
  }
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

  const nodeEl = DroppedNode.isNode(target);
  if (nodeEl) {
    DroppedNode.replaceNode(editor.value, { block, target: nodeEl });
    return;
  }

  const isTriggerExists =
    block.id === 'trigger' &&
    editor.value.getNodes.value.some((node) => node.label === 'trigger');
  if (isTriggerExists) return;

  const position = editor.value.project({ x: clientX - 360, y: clientY - 18 });
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
      type,
      data,
      label,
      id: newNodeId,
      selected: true,
      position: nodePos,
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
}
function copySelectedElements(data = {}) {
  store.copiedEls.nodes = data.nodes || editor.value.getSelectedNodes.value;
  store.copiedEls.edges = data.edges || editor.value.getSelectedEdges.value;
}
function pasteCopiedElements(position) {
  editor.value.removeSelectedNodes(editor.value.getSelectedNodes.value);
  editor.value.removeSelectedEdges(editor.value.getSelectedEdges.value);

  const { nodes, edges } = copyElements(
    store.copiedEls.nodes,
    store.copiedEls.edges,
    position
  );
  editor.value.addNodes(nodes);
  editor.value.addEdges(edges);
}
function onKeydown({ ctrlKey, metaKey, key, target }) {
  const els = ['INPUT', 'SELECT', 'TEXTAREA'];
  if (els.includes(target.tagName) || target.isContentEditable) return;

  const command = (keyName) => (ctrlKey || metaKey) && keyName === key;

  if (command('c')) {
    copySelectedElements();
  } else if (command('v')) {
    pasteCopiedElements();
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
function undoRedoCommand(type, { target }) {
  const els = ['INPUT', 'SELECT', 'TEXTAREA'];
  if (els.includes(target.tagName) || target.isContentEditable) return;

  executeCommand(type);
}

const shortcut = useShortcut([
  getShortcut('editor:toggle-sidebar', toggleSidebar),
  getShortcut('editor:duplicate-block', duplicateElements),
  getShortcut('action:undo', (_, event) => undoRedoCommand('undo', event)),
  getShortcut('action:redo', (_, event) => undoRedoCommand('redo', event)),
]);

watch(
  () => state.activeTab,
  (value) => {
    router.replace({ ...route, query: { tab: value } });
  }
);
watch(
  () => route.params.id,
  (value, oldValue) => {
    if (route.name !== 'workflows-details') return;
    if (value && oldValue && value !== oldValue) {
      window.location.reload();
    }
  }
);

/* eslint-disable consistent-return */
onBeforeRouteLeave(() => {
  updateHostedWorkflow();

  if (!state.dataChanged) return;

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
  updateWorkflow({ drawflow: convertedData.drawflow }).then(() => {
    state.workflowConverted = true;
  });

  if (route.query.permission) {
    getWorkflowPermissions(workflow.value.drawflow).then((permissions) => {
      if (permissions.length === 0) return;

      permissionState.items = permissions;
      permissionState.showModal = true;
    });
  }

  if (workflow.value.connectedTable) {
    fetchConnectedTable();
  }

  window.onbeforeunload = () => {
    updateHostedWorkflow();

    if (state.dataChanged) {
      return t('message.notSaved');
    }
  };
  window.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => {
  window.onbeforeunload = null;
  window.removeEventListener('keydown', onKeydown);
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

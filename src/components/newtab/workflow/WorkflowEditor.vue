<template>
  <vue-flow
    :id="props.id"
    :class="{ disabled: isDisabled }"
    :default-edge-options="{
      type: 'custom',
      updatable: true,
      selectable: true,
      markerEnd: settings.arrow ? MarkerType.ArrowClosed : '',
    }"
  >
    <Background />
    <MiniMap
      v-if="minimap"
      :node-class-name="minimapNodeClassName"
      class="hidden md:block"
    />
    <div
      v-if="editorControls"
      class="flex items-center absolute w-full p-4 left-0 bottom-0 z-10 md:pr-60"
    >
      <slot name="controls-prepend" />
      <editor-search-blocks :editor="editor" />
      <div class="flex-grow pointer-events-none" />
      <slot name="controls-append" />
      <button
        v-tooltip.group="t('workflow.editor.resetZoom')"
        class="control-button mr-2"
        @click="editor.fitView()"
      >
        <v-remixicon name="riFullscreenLine" />
      </button>
      <div class="rounded-lg bg-white dark:bg-gray-800 inline-block">
        <button
          v-tooltip.group="t('workflow.editor.zoomOut')"
          class="p-2 rounded-lg relative z-10"
          @click="editor.zoomOut()"
        >
          <v-remixicon name="riSubtractLine" />
        </button>
        <hr class="h-6 border-r inline-block" />
        <button
          v-tooltip.group="t('workflow.editor.zoomIn')"
          class="p-2 rounded-lg"
          @click="editor.zoomIn()"
        >
          <v-remixicon name="riAddLine" />
        </button>
      </div>
    </div>
    <template v-for="(node, name) in nodeTypes" :key="name" #[name]="nodeProps">
      <component
        :is="node"
        v-bind="{
          ...nodeProps,
          editor: name === 'node-BlockPackage' ? editor : null,
        }"
        @delete="deleteBlock"
        @settings="initEditBlockSettings"
        @edit="editBlock(nodeProps, $event)"
        @update="updateBlockData(nodeProps.id, $event)"
      />
    </template>
    <template #edge-custom="edgeProps">
      <editor-custom-edge v-bind="edgeProps" />
    </template>
    <ui-modal
      v-model="blockSettingsState.show"
      :title="t('workflow.blocks.base.settings.title')"
      content-class="max-w-xl modal-block-settings"
      @close="clearBlockSettings"
    >
      <edit-block-settings
        :data="blockSettingsState.data"
        @change="updateBlockData(blockSettingsState.data.blockId, $event)"
      />
    </ui-modal>
  </vue-flow>
</template>
<script setup>
import { onMounted, onBeforeUnmount, watch, computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  VueFlow,
  useVueFlow,
  MarkerType,
  getConnectedEdges,
} from '@vue-flow/core';
import { Background, MiniMap } from '@vue-flow/additional-components';
import cloneDeep from 'lodash.clonedeep';
import { useStore } from '@/stores/main';
import { getBlocks } from '@/utils/getSharedData';
import { categories } from '@/utils/shared';
import EditBlockSettings from './edit/EditBlockSettings.vue';
import EditorCustomEdge from './editor/EditorCustomEdge.vue';
import EditorSearchBlocks from './editor/EditorSearchBlocks.vue';

const props = defineProps({
  id: {
    type: String,
    default: 'editor',
  },
  data: {
    type: Object,
    default: () => ({
      x: 0,
      y: 0,
      zoom: 0,
      nodes: [],
      edges: [],
    }),
  },
  options: {
    type: Object,
    default: () => ({}),
  },
  editorControls: {
    type: Boolean,
    default: true,
  },
  minimap: {
    type: Boolean,
    default: true,
  },
  disabled: Boolean,
});
const emit = defineEmits(['edit', 'init', 'update:node', 'delete:node']);

const fallbackBlocks = {
  BlockBasic: ['BlockExportData'],
  BlockBasicWithFallback: ['BlockWebhook'],
};

const isMac = navigator.appVersion.indexOf('Mac') !== -1;
const blockComponents = require.context('@/components/block', false, /\.vue$/);
const nodeTypes = blockComponents.keys().reduce((acc, key) => {
  const name = key.replace(/(.\/)|\.vue$/g, '');
  const component = blockComponents(key).default;

  if (fallbackBlocks[name]) {
    fallbackBlocks[name].forEach((fallbackBlock) => {
      acc[`node-${fallbackBlock}`] = component;
    });
  }

  acc[`node-${name}`] = component;

  return acc;
}, {});
const getPosition = (position) => (Array.isArray(position) ? position : [0, 0]);
const setMinValue = (num, min) => (num < min ? min : num);

const { t } = useI18n();
const store = useStore();
const editor = useVueFlow({
  id: props.id,
  edgeUpdaterRadius: 20,
  deleteKeyCode: 'Delete',
  elevateEdgesOnSelect: true,
  defaultZoom: props.data?.zoom ?? 1,
  minZoom: setMinValue(+store.settings.editor.minZoom || 0.5, 0.1),
  maxZoom: setMinValue(
    +store.settings.editor.maxZoom || 1.2,
    +store.settings.editor.minZoom + 0.1
  ),
  multiSelectionKeyCode: isMac ? 'Meta' : 'Control',
  defaultPosition: getPosition(props.data?.position),
  ...props.options,
});
editor.onConnect((params) => {
  params.class = `source-${params.sourceHandle} target-${params.targetHandle}`;
  params.updatable = true;
  editor.addEdges([params]);
});
editor.onEdgeUpdate(({ edge, connection }) => {
  const isBothOutput =
    connection.sourceHandle.includes('output') &&
    connection.targetHandle.includes('output');
  if (isBothOutput) return;

  Object.assign(edge, connection);
});

const blocks = getBlocks();
const settings = store.settings.editor;
const isDisabled = computed(() => props.options.disabled ?? props.disabled);

const blockSettingsState = reactive({
  show: false,
  data: {},
});

function initEditBlockSettings({ blockId, details, data }) {
  blockSettingsState.data = {
    blockId,
    id: details.id,
    data: cloneDeep(data),
  };
  blockSettingsState.show = true;
}
function clearBlockSettings() {
  Object.assign(blockSettingsState, {
    data: null,
    show: false,
  });
}
function minimapNodeClassName({ label }) {
  const { category } = blocks[label];
  const { color } = categories[category];

  return color;
}
function updateBlockData(nodeId, data = {}) {
  if (isDisabled.value) return;

  const node = editor.getNode.value(nodeId);
  node.data = { ...node.data, ...data };

  emit('update:node', node);
}
function editBlock({ id, label, data }, additionalData = {}) {
  if (isDisabled.value) return;

  emit('edit', {
    id: label,
    blockId: id,
    data: cloneDeep(data),
    ...additionalData,
  });
}
function deleteBlock(nodeId) {
  if (isDisabled.value) return;

  editor.removeNodes([nodeId]);
  emit('delete:node', nodeId);
}
function onMousedown(event) {
  if (isDisabled.value && event.shiftKey) {
    event.stopPropagation();
    event.preventDefault();
  }
}
function applyFlowData() {
  if (settings.snapToGrid) {
    editor.snapToGrid.value = true;
    editor.snapGrid.value = Object.values(settings.snapGrid);
  }

  editor.setNodes(props.data?.nodes || []);
  editor.setEdges(props.data?.edges || []);
  editor.setTransform({
    x: props.data?.x || 0,
    y: props.data?.y || 0,
    zoom: props.data?.zoom || 1,
  });
}

watch(
  () => props.disabled,
  (value) => {
    const keys = [
      'nodesDraggable',
      'edgesUpdatable',
      'nodesConnectable',
      'elementsSelectable',
    ];

    keys.forEach((key) => {
      editor[key].value = !value;
    });
  },
  { immediate: true }
);
watch(editor.getSelectedNodes, (nodes, _, cleanup) => {
  const connectedEdges = getConnectedEdges(nodes, editor.getEdges.value);

  connectedEdges.forEach((edge) => {
    edge.class = 'connected-edges';
  });

  cleanup(() => {
    connectedEdges.forEach((edge) => {
      edge.class = undefined;
    });
  });
});

onMounted(() => {
  applyFlowData();
  window.addEventListener('mousedown', onMousedown, true);
  emit('init', editor);
});
onBeforeUnmount(() => {
  window.removeEventListener('mousedown', onMousedown, true);
});
</script>
<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';

.control-button {
  @apply p-2 rounded-lg bg-white dark:bg-gray-800 transition-colors;
}
</style>

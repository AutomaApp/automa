<template>
  <vue-flow
    :id="props.id"
    :class="{ disabled: options.disabled }"
    :default-edge-options="{
      updatable: true,
      selectable: true,
      type: settings.lineType,
      markerEnd: settings.arrow ? MarkerType.ArrowClosed : '',
    }"
  >
    <Background />
    <MiniMap v-if="minimap" :node-class-name="minimapNodeClassName" />
    <div
      v-if="editorControls"
      class="flex items-end absolute p-4 left-0 bottom-0 z-10"
    >
      <slot name="controls-prepend" />
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
      <editor-search-blocks :editor="editor" />
      <slot name="controls-append" />
    </div>
    <template v-for="(node, name) in nodeTypes" :key="name" #[name]="nodeProps">
      <component
        :is="node"
        v-bind="nodeProps"
        @delete="deleteBlock"
        @edit="editBlock(nodeProps, $event)"
        @update="updateBlockData(nodeProps.id, $event)"
      />
    </template>
  </vue-flow>
</template>
<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  VueFlow,
  MiniMap,
  Background,
  useVueFlow,
  MarkerType,
} from '@braks/vue-flow';
import cloneDeep from 'lodash.clonedeep';
import { useStore } from '@/stores/main';
import { tasks, categories } from '@/utils/shared';
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

const { t } = useI18n();
const store = useStore();
const editor = useVueFlow({
  id: props.id,
  minZoom: 1,
  edgeUpdaterRadius: 20,
  deleteKeyCode: 'Delete',
  elevateEdgesOnSelect: true,
  defaultZoom: props.data?.zoom ?? 1,
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

const settings = store.settings.editor;

function minimapNodeClassName({ label }) {
  const { category } = tasks[label];
  const { color } = categories[category];

  return color;
}
function updateBlockData(nodeId, data = {}) {
  if (props.options.disabled) return;

  const node = editor.getNode.value(nodeId);
  node.data = { ...node.data, ...data };

  emit('update:node', node);
}
function editBlock({ id, label, data }, additionalData = {}) {
  if (props.options.disabled) return;

  emit('edit', {
    id: label,
    blockId: id,
    data: cloneDeep(data),
    ...additionalData,
  });
}
function deleteBlock(nodeId) {
  if (props.options.disabled) return;

  editor.removeNodes([nodeId]);
  emit('delete:node', nodeId);
}
function onMousedown(event) {
  if (props.options.disabled && event.shiftKey) {
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
@import '@braks/vue-flow/dist/style.css';
@import '@braks/vue-flow/dist/theme-default.css';

.control-button {
  @apply p-2 rounded-lg bg-white dark:bg-gray-800 transition-colors;
}
</style>

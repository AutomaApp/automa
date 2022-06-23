<template>
  <vue-flow :id="props.id">
    <Background />
    <MiniMap :node-class-name="minimapNodeClassName" />
    <div class="flex items-end absolute p-4 left-0 bottom-0 z-10">
      <button
        v-tooltip.group="t('workflow.editor.resetZoom')"
        class="p-2 rounded-lg bg-white dark:bg-gray-800 mr-2"
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
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { VueFlow, Background, MiniMap, useVueFlow } from '@braks/vue-flow';
import cloneDeep from 'lodash.clonedeep';
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
});
const emit = defineEmits(['edit', 'init', 'update:node', 'delete:node']);

const isMac = navigator.appVersion.indexOf('Mac') !== -1;
const blockComponents = require.context('@/components/block', false, /\.vue$/);
const nodeTypes = blockComponents.keys().reduce((acc, key) => {
  const name = key.replace(/(.\/)|\.vue$/g, '');
  acc[`node-${name}`] = blockComponents(key).default;

  return acc;
}, {});

const { t } = useI18n();
const editor = useVueFlow({
  id: props.id,
  minZoom: 0.4,
  defaultZoom: 0,
  deleteKeyCode: 'Delete',
  multiSelectionKeyCode: isMac ? 'Meta' : 'Control',
  ...props.data,
});
editor.onConnect((params) => {
  params.class = `source-${params.sourceHandle} target-${params.targetHandle}`;
  editor.addEdges([params]);
});

function minimapNodeClassName({ label }) {
  const { category } = tasks[label];
  const { color } = categories[category];

  return color;
}
function updateBlockData(nodeId, data) {
  const node = editor.getNode.value(nodeId);
  Object.assign(node.data, data);
  emit('update:node', node);
}
function editBlock({ id, label, data }, additionalData = {}) {
  emit('edit', {
    id: label,
    blockId: id,
    data: cloneDeep(data),
    ...additionalData,
  });
}
function deleteBlock(nodeId) {
  editor.removeNodes([nodeId]);
  emit('delete:node', nodeId);
}

onMounted(() => {
  editor.setTransform({
    x: props.data.x || 0,
    y: props.data.y || 0,
    zoom: props.data.zoom || 1,
  });

  emit('init', editor);
});
</script>
<style>
@import '@braks/vue-flow/dist/style.css';
@import '@braks/vue-flow/dist/theme-default.css';
</style>

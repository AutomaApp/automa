<template>
  <div class="px-4 pb-4">
    <div class="flex items-center mt-4">
      <button @click="$emit('goBack')">
        <v-remixicon
          name="riArrowLeftLine"
          class="-ml-1 mr-1 align-bottom inline-block"
        />
      </button>
      <p class="font-semibold flex-1 text-overflow">
        {{ workflow.name }}
      </p>
    </div>
    <p class="mt-2">
      {{ t('home.record.selectBlock') }}
    </p>
    <workflow-editor
      :minimap="false"
      :editor-controls="false"
      :options="editorOptions"
      class="h-56 w-full rounded-lg bg-box-transparent"
      @init="onEditorInit"
    />
    <ui-button
      :disabled="!state.activeBlock"
      variant="accent"
      class="mt-6 w-full"
      @click="startRecording"
    >
      {{ t('home.record.button') }}
    </ui-button>
  </div>
</template>
<script setup>
import { onMounted, onBeforeUnmount, shallowReactive } from 'vue';
import { useI18n } from 'vue-i18n';
import convertWorkflowData from '@/utils/convertWorkflowData';
import WorkflowEditor from '@/components/newtab/workflow/WorkflowEditor.vue';

const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['goBack', 'record', 'update']);

const { t } = useI18n();

const editorOptions = {
  disabled: true,
  fitViewOnInit: true,
  nodesDraggable: false,
  edgesUpdatable: false,
  nodesConnectable: false,
};

const state = shallowReactive({
  retrieved: false,
  activeBlock: null,
  blockOutput: null,
});

function onEditorInit(editor) {
  const convertedData = convertWorkflowData(props.workflow);
  emit('update', { drawflow: convertedData.drawflow });

  editor.setNodes(convertedData.drawflow.nodes);
  editor.setEdges(convertedData.drawflow.edges);
}
function clearSelectedHandle() {
  document.querySelectorAll('.selected-handle').forEach((el) => {
    el.classList.remove('selected-handle');
  });
}
function onClick({ target }) {
  let selectedHandle = null;

  const handleEl = target.closest('.vue-flow__handle.source');
  if (handleEl) {
    clearSelectedHandle();
    handleEl.classList.add('selected-handle');
    selectedHandle = handleEl;
  }

  if (!handleEl) {
    const nodeEl = target.closest('.vue-flow__node');
    if (nodeEl) {
      clearSelectedHandle();
      const handle = nodeEl.querySelector('.vue-flow__handle.source');
      handle.classList.add('selected-handle');
      selectedHandle = handle;
    }
  }

  if (!selectedHandle) return;

  const { handleid, nodeid } = selectedHandle.dataset;
  state.activeBlock = nodeid;
  state.blockOutput = handleid;
}
function startRecording() {
  const options = {
    name: props.workflow.name,
    workflowId: props.workflow.id,
    connectFrom: {
      id: state.activeBlock,
      output: state.blockOutput,
    },
  };

  emit('record', options);
}

onMounted(() => {
  window.addEventListener('click', onClick);
});
onBeforeUnmount(() => {
  window.removeEventListener('click', onClick);
});
</script>
<style>
.selected-handle {
  @apply ring-4;
}

.vue-flow__handle.source {
  pointer-events: auto !important;
}
</style>

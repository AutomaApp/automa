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
    <div
      ref="editorContainer"
      class="parent-drawflow h-56 min-h w-full rounded-lg bg-box-transparent"
    ></div>
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
import {
  shallowReactive,
  ref,
  getCurrentInstance,
  shallowRef,
  onMounted,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { findTriggerBlock } from '@/utils/helper';
import drawflow from '@/lib/drawflow';

const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['goBack', 'record']);

const { t } = useI18n();
const context = getCurrentInstance().appContext.app._context;

const editor = shallowRef(null);
const editorContainer = ref(null);
const state = shallowReactive({
  activeBlock: null,
  blockOutput: 'output_1',
});

function onEditorClick(event) {
  const [target] = event.composedPath();
  const nodeEl = target.closest('.drawflow-node');

  if (nodeEl) {
    const prevActiveEl = editorContainer.value.querySelector(
      '.drawflow-node.selected'
    );
    if (prevActiveEl) {
      prevActiveEl.classList.remove('selected');

      const outputEl = prevActiveEl.querySelector('.output.active');
      outputEl.classList.remove('active');
    }

    const nodeId = nodeEl.id.slice(5);
    const node = editor.value.getNodeFromId(nodeId);
    const outputs = Object.keys(node.outputs);

    if (outputs.length === 0) {
      alert(t('home.record.anotherBlock'));
      state.activeBlock = null;
      state.blockOutput = null;
      return;
    }

    let outputEl = target.closest('.output');

    if (outputEl) {
      /* eslint-disable-next-line */
      state.blockOutput = outputEl.classList[1];
      outputEl.classList.add('active');
    } else {
      const firstOutput = outputs[0];

      state.blockOutput = firstOutput || '';
      outputEl = nodeEl.querySelector(`.${firstOutput}`);
    }

    if (outputEl) outputEl.classList.add('active');

    nodeEl.classList.add('selected');
    state.activeBlock = node;
  }
}
function startRecording() {
  const options = {
    name: props.workflow.name,
    workflowId: props.workflow.id,
    connectFrom: {
      id: state.activeBlock.id,
      output: state.blockOutput,
    },
  };

  emit('record', options);
}

onMounted(() => {
  const flowData = props.workflow.drawflow;
  const flow = typeof flowData === 'string' ? JSON.parse(flowData) : flowData;
  const triggerBlock = findTriggerBlock(flow);

  const editorInstance = drawflow(editorContainer.value, {
    context,
    options: {
      zoom: 0.5,
      zoom_min: 0.1,
      zoom_max: 0.8,
      minimap: true,
      editor_mode: 'fixed',
    },
  });

  editorInstance.start();
  editorInstance.import(flow);

  if (triggerBlock) {
    const getCoordinate = (pos) => {
      const num = Math.abs(pos);

      if (pos > 0) return -num;

      return num;
    };

    editorInstance.translate_to(
      getCoordinate(triggerBlock.pos_x),
      getCoordinate(triggerBlock.pos_y)
    );
  }

  editor.value = editorInstance;
  editorContainer.value.addEventListener('click', onEditorClick);
});
</script>
<style>
.output.active {
  @apply ring-4;
}
</style>

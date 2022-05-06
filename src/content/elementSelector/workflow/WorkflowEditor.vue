<template>
  <workflow-list
    v-if="!activeWorkflow"
    :workflows="state.workflows"
    @select="state.activeWorkflow = $event"
  />
  <div v-else class="mt-4 px-4 pb-4">
    <div class="flex items-center">
      <button class="group" @click="state.activeWorkflow = ''">
        <v-remixicon
          name="riArrowLeftLine"
          class="group-hover:-translate-x-1 -ml-1 transition-transform align-bottom inline-block"
        />
      </button>
      <p class="flex-1 text-overflow font-semibold ml-1">
        {{ activeWorkflow.name }}
      </p>
    </div>
    <p class="mt-2">Select a block output to start</p>
    <div
      ref="editorContainer"
      class="parent-drawflow h-40 min-h w-full rounded-lg bg-box-transparent"
    ></div>
    <workflow-add-block v-if="activeBlock" />
  </div>
</template>
<script setup>
import {
  shallowReactive,
  computed,
  watch,
  ref,
  getCurrentInstance,
  shallowRef,
  inject,
} from 'vue';
import browser from 'webextension-polyfill';
import { findTriggerBlock } from '@/utils/helper';
import drawflow from '@/lib/drawflow';
import WorkflowList from './WorkflowList.vue';
import WorkflowAddBlock from './WorkflowAddBlock.vue';

const rootElement = inject('rootElement');
const context = getCurrentInstance().appContext.app._context;

const editor = shallowRef(null);
const editorContainer = ref(null);
const activeBlock = shallowRef(null);
const state = shallowReactive({
  workflows: [],
  activeWorkflow: '',
  blockOutput: 'output_1',
});

const activeWorkflow = computed(() =>
  state.workflows.find(({ id }) => id === state.activeWorkflow)
);

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
    let outputEl = target.closest('.output');

    if (outputEl) {
      /* eslint-disable-next-line */
      state.blockOutput = outputEl.classList[1];
      outputEl.classList.add('active');
    } else {
      const firstOutput = Object.keys(node.outputs)[0];

      state.blockOutput = firstOutput || '';
      outputEl = nodeEl.querySelector(`.${firstOutput}`);
    }

    console.log(outputEl);
    if (outputEl) outputEl.classList.add('active');

    nodeEl.classList.add('selected');
    activeBlock.value = node;
    console.log(activeBlock.value);
  }
}

watch(editorContainer, (element) => {
  if (!activeWorkflow.value) return;

  const flowData = activeWorkflow.value.drawflow;
  const flow = typeof flowData === 'string' ? JSON.parse(flowData) : flowData;
  const triggerBlock = findTriggerBlock(flow);

  const editorInstance = drawflow(element, {
    context,
    options: {
      zoom: 0.5,
      zoom_min: 0.1,
      zoom_max: 0.8,
      minimap: true,
      editor_mode: 'fixed',
      rootElement: rootElement.shadowRoot,
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
  element.addEventListener('click', onEditorClick);
});

(async () => {
  const { workflows } = await browser.storage.local.get('workflows');
  state.workflows = (workflows || []).reverse();
})();
</script>
<style>
.output.active {
  @apply ring-4;
}
</style>

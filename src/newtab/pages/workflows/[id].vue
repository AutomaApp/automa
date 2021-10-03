<template>
  <div class="flex h-screen">
    <div
      class="w-80 bg-white py-4 relative border-l border-gray-100 flex flex-col"
    >
      <workflow-edit-block
        v-if="state.isEditBlock"
        :data="state.blockData"
        @update="updateBlockData"
        @close="(state.isEditBlock = false), (state.blockData = {})"
      />
      <workflow-details-card
        v-else
        :workflow="workflow"
        @save="saveWorkflow"
        @execute="executeWorkflow"
        @update="updateWorkflow"
      />
    </div>
    <workflow-builder
      class="flex-1"
      :data="workflow.drawflow"
      @load="editor = $event"
      @addBlock="addBlock"
      @deleteBlock="deleteBlock"
      @export="updateWorkflow({ drawflow: $event })"
    />
  </div>
</template>
<script setup>
import {
  computed,
  reactive,
  shallowRef,
  provide,
  onMounted,
  onUnmounted,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import emitter from 'tiny-emitter/instance';
import Task from '@/models/task';
import Workflow from '@/models/workflow';
import { debounce } from '@/utils/helper';
import WorkflowBuilder from '@/components/newtab/workflow/WorkflowBuilder.vue';
import WorkflowEditBlock from '@/components/newtab/workflow/WorkflowEditBlock.vue';
import WorkflowDetailsCard from '@/components/newtab/workflow/WorkflowDetailsCard.vue';

const route = useRoute();
const router = useRouter();

const workflowId = route.params.id;

const editor = shallowRef(null);
const state = reactive({
  isEditBlock: false,
  blockData: {},
});
const workflow = computed(() => Workflow.find(workflowId) || {});

const updateBlockData = debounce((data) => {
  state.blockData.data = data;
  editor.value.updateNodeDataFromId(state.blockData.blockId, data);

  const inputEl = document.querySelector(
    `#node-${state.blockData.blockId} input.trigger`
  );

  if (inputEl) inputEl.dispatchEvent(new Event('change'));
}, 250);
function addBlock(data) {
  Task.insert({
    data: { ...data, workflowId },
  });
}
function deleteBlock(id) {
  if (state.isEditBlock && state.blockData.blockId === id) {
    state.isEditBlock = false;
    state.blockData = {};
  }
}
function updateWorkflow(data) {
  Workflow.update({
    where: workflowId,
    data,
  });
}
function saveWorkflow() {
  const data = editor.value.export();
  console.log(data);
  updateWorkflow({ drawflow: JSON.stringify(data) });
}
function editBlock(data) {
  state.isEditBlock = true;
  state.blockData = data;
}
function executeWorkflow() {
  console.log(editor.value);
}

provide('workflow', {
  data: workflow,
  updateWorkflow,
});

onMounted(() => {
  const isWorkflowExists = Workflow.query().where('id', workflowId).exists();

  if (!isWorkflowExists) {
    router.push('/workflows');
  }

  emitter.on('editor:edit-block', editBlock);
});
onUnmounted(() => {
  emitter.off('editor:edit-block', editBlock);
});
</script>
<style>
.ghost-task {
  height: 40px;
  @apply bg-box-transparent;
}
.ghost-task:not(.workflow-task) * {
  display: none;
}
</style>

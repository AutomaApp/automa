<template>
  <div class="flex h-screen">
    <workflow-details-card :workflow="workflow" />
    <workflow-builder
      class="flex-1"
      :data="workflow.drawflow"
      @addBlock="addBlock"
      @deleteBlock="deleteBlock"
      @saveWorkflow="saveWorkflow"
    />
  </div>
</template>
<script setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Task from '@/models/task';
import Workflow from '@/models/workflow';
import WorkflowBuilder from '@/components/newtab/workflow/WorkflowBuilder.vue';
import WorkflowDetailsCard from '@/components/newtab/workflow/WorkflowDetailsCard.vue';

const route = useRoute();
const router = useRouter();

const workflowId = route.params.id;
const workflow = computed(() => Workflow.find(workflowId) || {});

function addBlock(data) {
  Task.insert({
    data: { ...data, workflowId },
  });
}
function deleteBlock(id) {
  Task.delete(id);
}
function saveWorkflow(data) {
  console.log('saved', workflowId, data);
  Workflow.update({
    where: workflowId,
    data: { drawflow: data },
  });
}

onMounted(() => {
  const isWorkflowExists = Workflow.query().where('id', workflowId).exists();

  if (!isWorkflowExists) {
    router.push('/workflows');
  }
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

<template>
  <div class="flex h-screen">
    <workflow-details-card :workflow="workflow" />
    <workflow-builder class="flex-1" />
  </div>
</template>
<script setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Workflow from '@/models/workflow';
import WorkflowBuilder from '@/components/newtab/workflow/WorkflowBuilder.vue';
import WorkflowDetailsCard from '@/components/newtab/workflow/WorkflowDetailsCard.vue';

const route = useRoute();
const router = useRouter();

const workflow = computed(() => Workflow.find(route.params.id) || {});

onMounted(() => {
  const isWorkflowExists = Workflow.query()
    .where('id', route.params.id)
    .exists();

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

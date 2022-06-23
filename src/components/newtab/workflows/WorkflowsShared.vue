<template>
  <shared-card
    v-for="workflow in workflows"
    :key="workflow.id"
    :data="workflow"
    :show-details="false"
    @execute="executeWorkflow(workflow)"
    @click="$router.push(`/workflows/${$event.id}/shared`)"
  />
</template>
<script setup>
import { computed } from 'vue';
import { useWorkflowStore } from '@/stores/workflow';
import { arraySorter } from '@/utils/helper';
import SharedCard from '@/components/newtab/shared/SharedCard.vue';

const props = defineProps({
  search: {
    type: String,
    default: '',
  },
  sort: {
    type: Object,
    default: () => ({
      by: '',
      order: '',
    }),
  },
});

const workflowStore = useWorkflowStore();

const workflows = computed(() => {
  const filtered = Object.values(workflowStore.shared).filter(({ name }) =>
    name.toLocaleLowerCase().includes(props.search.toLocaleLowerCase())
  );

  return arraySorter({
    data: filtered,
    key: props.sort.by,
    order: props.sort.order,
  });
});
</script>

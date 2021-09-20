<template>
  <h1 class="text-2xl font-semibold mb-8">Workflows</h1>
  <div class="flex items-center mb-6 space-x-4">
    <ui-input
      prepend-icon="riSearch2Line"
      placeholder="Search..."
      class="flex-1"
    />
    <div class="flex items-center workflow-sort">
      <ui-button icon class="rounded-r-none border-gray-300 border-r">
        <v-remixicon name="riSortAsc" />
      </ui-button>
      <ui-select placeholder="Sort by">
        <option v-for="sort in sorts" :key="sort.id" :value="sort.id">
          {{ sort.name }}
        </option>
      </ui-select>
    </div>
    <ui-button variant="accent"> New Workflow </ui-button>
  </div>
  <div class="grid gap-4 grid-cols-4">
    <workflow-card v-for="i in 13" :key="i" />
  </div>
</template>
<script setup>
import WorkflowCard from '@/components/newtab/workflow/WorkflowCard.vue';

const sorts = [
  { name: 'Name', id: 'name' },
  { name: 'Created date', id: 'createdAt' },
  { name: 'Running date', id: 'lastRunAt' },
];
</script>
<style>
.workflow-sort select {
  @apply rounded-l-none !important;
}
</style>

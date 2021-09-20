<template>
  <div class="bg-accent rounded-b-2xl h-36 p-5 w-full text-white dark">
    <div class="flex items-center mb-4 text-gray-100 justify-between">
      <router-link to="/" class="-ml-2">
        <v-remixicon name="riArrowLeftSLine" size="28" />
      </router-link>
      <router-link :to="`/workflow/${$route.params.id}/edit`" title="Edit">
        <v-remixicon name="riEditBoxLine" />
      </router-link>
    </div>
    <h1 class="text-xl font-semibold">Workflow name</h1>
  </div>
  <div class="px-5 mb-2 -mt-10">
    <ui-card class="mb-4 flex space-x-2">
      <ui-button class="w-6/12">
        <v-remixicon class="-ml-1 mr-1" name="riPauseLine" />
        <span>Pause</span>
      </ui-button>
      <ui-button variant="accent" class="w-6/12">
        <v-remixicon class="-ml-1 mr-1" name="riStopLine" />
        <span>Stop</span>
      </ui-button>
    </ui-card>
    <p class="mb-1">Tasks</p>
    <shared-task-list :tasks="tasks" />
  </div>
</template>
<script setup>
import SharedTaskList from '@/components/shared/SharedTaskList.vue';

const tasks = [
  { name: 'Open website', status: 'success' },
  { name: 'Get data', status: 'success' },
  { name: 'Close web', status: 'running' },
];
</script>

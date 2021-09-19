<template>
  <div class="bg-accent rounded-b-2xl h-36 p-5 w-full text-white dark">
    <div class="flex items-center mb-4 text-gray-100 justify-between">
      <router-link to="/" class="-ml-2">
        <v-remixicon name="riArrowLeftSLine" size="28" />
      </router-link>
      <a href="/" target="_blank" title="Edit">
        <v-remixicon name="riEditBoxLine" />
      </a>
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
    <ui-list class="space-y-1">
      <ui-list-item
        v-for="task in tasks"
        :key="task.name"
        :active="task.status === 'running'"
        class="relative group"
        color="bg-box-transparent"
      >
        <v-remixicon
          name="mdiDrag"
          class="
            absolute
            left-0
            -ml-3
            group-hover:visible
            invisible
            cursor-move
          "
        />
        <ui-spinner
          v-if="task.status === 'running'"
          color="text-accent"
          size="20"
        ></ui-spinner>
        <v-remixicon
          v-else-if="task.status === 'success'"
          name="riCheckboxCircleLine"
          class="-ml-0.5"
        />
        <p class="ml-3 flex-1">{{ task.name }}</p>
      </ui-list-item>
    </ui-list>
  </div>
</template>
<script setup>
const tasks = [
  { name: 'Open website', status: 'success' },
  { name: 'Get data', status: 'success' },
  { name: 'Close web', status: 'running' },
];
</script>

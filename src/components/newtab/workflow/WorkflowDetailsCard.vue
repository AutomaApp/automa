<template>
  <ui-card class="w-80 h-full" padding="p-0">
    <div class="mb-4 px-4 pt-4">
      <span
        class="p-2 inline-block align-middle rounded-lg bg-box-transparent mr-2"
      >
        <v-remixicon name="riGlobalLine" />
      </span>
      <p class="font-semibold text-lg inline-block align-middle">
        Workflow name
      </p>
    </div>
    <div class="flex items-center px-4">
      <ui-button variant="accent" class="flex-1 mr-2">
        <v-remixicon class="-ml-1 mr-1" name="riPlayLine" />
        Execute
      </ui-button>
      <ui-button icon class="text-red-500">
        <v-remixicon name="riDeleteBin7Line" />
      </ui-button>
    </div>
    <ui-tabs v-model="state.activeTab" fill class="mx-4 mt-5 mb-4">
      <ui-tab value="tasks">Tasks</ui-tab>
      <ui-tab value="data-schema">Data Schema</ui-tab>
    </ui-tabs>
    <ui-tab-panels v-model="state.activeTab">
      <ui-tab-panel
        value="tasks"
        class="px-4 grid grid-cols-2 gap-2 pb-4 overflow-auto pt-1"
        style="max-height: calc(100vh - 200px)"
      >
        <div
          v-for="task in taskList"
          :key="task.id"
          :title="task.name"
          class="
            cursor-move
            select-none
            group
            p-4
            rounded-lg
            bg-input
            transition
          "
        >
          <v-remixicon :name="task.icon" size="24" class="mb-3" />
          <p class="leading-tight text-overflow">
            {{ task.name }}
          </p>
        </div>
      </ui-tab-panel>
      <ui-tab-panel value="data-schema">
        <p>sss</p>
      </ui-tab-panel>
    </ui-tab-panels>
  </ui-card>
</template>
<script setup>
import { shallowReactive } from 'vue';

const taskList = [
  {
    id: 'event-click',
    name: 'Click element',
    icon: 'riCursorLine',
  },
  {
    id: 'export-data',
    name: 'Export data',
    icon: 'riDownloadLine',
  },
  {
    id: 'element-scroll',
    name: 'Scroll element',
    icon: 'riMouseLine',
  },
  {
    id: 'open-website',
    name: 'Open website',
    icon: 'riGlobalLine',
  },
  {
    id: 'text-input',
    name: 'Text input',
    icon: 'riInputCursorMove',
  },
  {
    id: 'repeat-task',
    name: 'Repeat tasks',
    icon: 'riRepeat2Line',
  },
  {
    id: 'get-attribute',
    name: 'Get attribute',
    icon: 'riBracketsLine',
  },
  {
    id: 'trigger-events',
    name: 'Trigger events',
    icon: 'riEqualizerLine',
  },
].sort((a, b) => (a.name > b.name ? 1 : -1));

const state = shallowReactive({
  activeTab: 'tasks',
});
</script>

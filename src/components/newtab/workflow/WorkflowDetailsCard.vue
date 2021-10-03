<template>
  <div class="px-4 mb-2">
    <span
      class="p-2 inline-block rounded-lg bg-accent text-white mr-2 align-middle"
    >
      <v-remixicon :name="workflow.icon" />
    </span>
    <p class="font-semibold inline-block text-lg flex-1 mr-4 align-middle">
      {{ workflow.name }}
    </p>
  </div>
  <div class="flex px-4 mt-2 space-x-2">
    <ui-button variant="accent" class="flex-1" @click="$emit('save')">
      <v-remixicon name="riSaveLine" class="mr-2 -ml-1" />
      Save
    </ui-button>
    <ui-button icon title="Data columns" @click="$emit('showDataColumns')">
      <v-remixicon name="riKey2Line" />
    </ui-button>
    <ui-popover>
      <template #trigger>
        <ui-button icon title="More">
          <v-remixicon name="riMore2Line" />
        </ui-button>
      </template>
      <ui-list class="w-36">
        <ui-list-item>
          <v-remixicon name="riPlayLine" class="mr-2 -ml-1" />
          <span>Execute</span>
        </ui-list-item>
        <ui-list-item>
          <v-remixicon name="riPencilLine" class="mr-2 -ml-1" />
          <span>Rename</span>
        </ui-list-item>
        <ui-list-item>
          <v-remixicon name="riDeleteBin7Line" class="mr-2 -ml-1" />
          <span>Delete</span>
        </ui-list-item>
      </ui-list>
    </ui-popover>
  </div>
  <hr class="m-4 border-gray-100" />
  <div class="scroll bg-scroll overflow-auto px-4 flex-1 overflow-auto">
    <template v-for="(items, catId) in taskList" :key="catId">
      <div class="flex items-center top-0 space-x-2 mb-2">
        <span
          :class="categories[catId].color"
          class="h-3 w-3 rounded-full"
        ></span>
        <p class="capitalize text-gray-600">{{ categories[catId].name }}</p>
      </div>
      <div class="grid grid-cols-2 gap-2 mb-4">
        <div
          v-for="task in items"
          :key="task.id"
          :title="task.name"
          draggable="true"
          class="
            select-none
            cursor-move
            relative
            p-4
            rounded-lg
            bg-input
            transition
          "
          @dragstart="
            $event.dataTransfer.setData('block', JSON.stringify(task))
          "
        >
          <v-remixicon :name="task.icon" size="24" class="mb-2" />
          <p class="leading-tight text-overflow">
            {{ task.name }}
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup>
import { tasks, categories } from '@/utils/shared';

defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
});
defineEmits(['update', 'execute', 'save', 'showDataColumns']);

const taskList = Object.keys(tasks).reduce((arr, key) => {
  const task = tasks[key];

  (arr[task.category] = arr[task.category] || []).push({ id: key, ...task });

  return arr;
}, {});
</script>

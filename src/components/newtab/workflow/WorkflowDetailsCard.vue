<template>
  <div class="px-4 flex items-center mb-2 mt-1">
    <ui-popover class="mr-2 h-6">
      <template #trigger>
        <span title="Workflow icon" class="cursor-pointer">
          <v-remixicon :name="workflow.icon" size="26" />
        </span>
      </template>
      <p class="mb-2">Workflow icon</p>
      <div class="grid grid-cols-4 gap-1">
        <span
          v-for="icon in icons"
          :key="icon"
          class="cursor-pointer rounded-lg inline-block p-2 hoverable"
          @click="$emit('update', { icon })"
        >
          <v-remixicon :name="icon" />
        </span>
      </div>
    </ui-popover>
    <p class="font-semibold text-overflow inline-block text-lg flex-1 mr-4">
      {{ workflow.name }}
    </p>
  </div>
  <ui-input
    v-model="query"
    prepend-icon="riSearch2Line"
    class="px-4 mt-4 mb-2"
    placeholder="Search blocks"
  />
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
          v-for="block in items"
          :key="block.id"
          :title="block.description || block.name"
          draggable="true"
          class="
            transform
            select-none
            cursor-move
            relative
            p-4
            rounded-lg
            bg-input
            transition
          "
          @dragstart="
            $event.dataTransfer.setData('block', JSON.stringify(block))
          "
        >
          <a
            v-if="block.docs"
            :href="`https://github.com/Kholid060/automa/wiki/Blocks#${block.id}`"
            target="_blank"
            title="Documentation"
            rel="noopener"
            class="absolute top-px right-2"
          >
            &#128712;
          </a>
          <v-remixicon :name="block.icon" size="24" class="mb-2" />
          <p class="leading-tight text-overflow">
            {{ block.name }}
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue';
import { tasks, categories } from '@/utils/shared';

defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
  dataChanged: {
    type: Boolean,
    default: false,
  },
});
defineEmits(['update']);

const icons = [
  'riGlobalLine',
  'riFileTextLine',
  'riEqualizerLine',
  'riTimerLine',
  'riCalendarLine',
  'riFlashlightLine',
  'riLightbulbFlashLine',
  'riDatabase2Line',
  'riWindowLine',
  'riCursorLine',
  'riDownloadLine',
  'riCommandLine',
];

const query = ref('');
const taskList = computed(() =>
  Object.keys(tasks).reduce((arr, key) => {
    const task = tasks[key];

    if (tasks[key].name.toLowerCase().includes(query.value.toLowerCase())) {
      (arr[task.category] = arr[task.category] || []).push({
        id: key,
        ...task,
      });
    }

    return arr;
  }, {})
);
</script>

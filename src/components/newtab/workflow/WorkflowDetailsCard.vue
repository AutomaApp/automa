<template>
  <div class="px-4 flex items-center mb-2">
    <ui-popover>
      <template #trigger>
        <span
          title="Workflow icon"
          class="
            p-2
            inline-block
            rounded-lg
            cursor-pointer
            bg-accent
            text-white
            mr-2
            align-middle
          "
        >
          <v-remixicon :name="workflow.icon" />
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
    <p
      class="
        font-semibold
        text-overflow
        inline-block
        text-lg
        flex-1
        mr-4
        align-middle
      "
    >
      {{ workflow.name }}
    </p>
  </div>
  <div class="flex px-4 mt-2 space-x-2">
    <ui-button variant="accent" class="flex-1 relative" @click="$emit('save')">
      <span
        v-if="dataChanged"
        class="
          inline-block
          absolute
          h-3
          w-3
          rounded-full
          bg-primary
          -ml-1
          -mt-1
          top-0
          left-0
        "
      ></span>
      <v-remixicon name="riSaveLine" class="mr-2 -ml-1" />
      Save
    </ui-button>
    <ui-button icon title="Execute" @click="$emit('execute')">
      <v-remixicon name="riPlayLine" />
    </ui-button>
    <ui-popover>
      <template #trigger>
        <ui-button icon title="More">
          <v-remixicon name="riMore2Line" />
        </ui-button>
      </template>
      <ui-list>
        <ui-list-item
          v-close-popover
          class="cursor-pointer"
          @click="$emit('rename')"
        >
          <v-remixicon name="riPencilLine" class="mr-2 -ml-1" />
          <span>Rename</span>
        </ui-list-item>
        <ui-list-item
          v-close-popover
          class="cursor-pointer"
          @click="$emit('showDataColumns')"
        >
          <v-remixicon name="riKey2Line" class="mr-2 -ml-1" />
          <span>Data columns</span>
        </ui-list-item>
        <ui-list-item
          v-close-popover
          class="cursor-pointer"
          @click="$emit('showSettings')"
        >
          <v-remixicon name="riSettings3Line" class="mr-2 -ml-1" />
          <span>Settings</span>
        </ui-list-item>
        <ui-list-item
          v-close-popover
          class="cursor-pointer"
          @click="$emit('delete')"
        >
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
          v-for="block in items"
          :key="block.id"
          :title="block.description || block.name"
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
            $event.dataTransfer.setData('block', JSON.stringify(block))
          "
        >
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
defineEmits([
  'save',
  'update',
  'rename',
  'delete',
  'execute',
  'showSettings',
  'showDataColumns',
]);

const taskList = Object.keys(tasks).reduce((arr, key) => {
  const task = tasks[key];

  (arr[task.category] = arr[task.category] || []).push({ id: key, ...task });

  return arr;
}, {});
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
</script>

<template>
  <div
    class="workflow-task rounded-lg group hoverable"
    :class="{ 'bg-box-transparent': show }"
  >
    <div
      class="
        flex
        items-center
        w-full
        text-left
        py-2
        px-3
        cursor-pointer
        rounded-lg
      "
      @click="show = !show"
    >
      <v-remixicon
        :rotate="show ? 270 : 180"
        name="riArrowLeftSLine"
        class="-ml-1 mr-4 text-gray-600 dark:text-gray-200 transition-transform"
      />
      <v-remixicon :name="currentTask.icon" size="22" class="mr-3" />
      <p class="flex-1 mr-2 text-overflow">
        {{ task.name || currentTask.name }}
      </p>
      <v-remixicon
        name="riDeleteBin7Line"
        class="group-hover:visible mr-2 invisible cursor-pointer"
        size="22"
        @click.stop="$emit('delete', task)"
      />
      <v-remixicon
        id="drag-handler"
        name="mdiDrag"
        style="cursor: grab"
        @mousedown="show = false"
      />
    </div>
    <transition-expand>
      <template v-if="show">
        <div class="pb-2 px-4">
          {{ task.type }}
        </div>
      </template>
    </transition-expand>
  </div>
</template>
<script setup>
/* eslint-disable no-undef */

import { ref, computed } from 'vue';
import { tasks } from '@/utils/shared';

const props = defineProps({
  task: {
    type: Object,
    default: () => ({}),
  },
});
defineEmits(['delete']);

const show = ref(false);
const currentTask = computed(() => tasks[props.task.type]);
</script>

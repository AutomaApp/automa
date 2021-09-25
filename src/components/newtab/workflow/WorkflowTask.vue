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
      <div v-if="show" class="py-2 pr-4 pl-12 max-w-xl">
        <div class="flex items-center mb-2">
          <ui-input
            :model-value="task.name"
            placeholder="Task name"
            class="flex-1"
            @change="updateTask({ name: $event || currentTask.task })"
          />
          <ui-input
            v-if="currentTask.needWebsite"
            placeholder="Website"
            class="flex-1 ml-2"
          />
        </div>
        <div v-if="currentTask.needSelector" class="flex items-center">
          <ui-button icon class="mr-2">
            <v-remixicon name="riFocus3Line" />
          </ui-button>
          <ui-input placeholder="Element selector" class="mr-4 flex-1" />
          <ui-checkbox>Multiple</ui-checkbox>
        </div>
        <!-- <component is="TaskClickElement" /> -->
      </div>
    </transition-expand>
  </div>
</template>
<script>
import { ref, computed } from 'vue';
import TaskClickElement from './task/TaskClickElement.vue';
</script>
<script setup>
import { tasks } from '@/utils/shared';

export default {
  components: { TaskClickElement },
};

const props = defineProps({
  task: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['delete', 'update']);

const show = ref(false);
const currentTask = computed(() => tasks[props.task.type]);

function updateTask(data) {
  emit('update', props.task.id, data);
}
</script>

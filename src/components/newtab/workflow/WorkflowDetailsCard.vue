<template>
  <div
    class="w-80 bg-white py-4 relative border-l border-gray-100 flex flex-col"
    padding="p-0"
  >
    <div class="px-4 mb-2">
      <span
        class="
          p-2
          inline-block
          rounded-lg
          bg-accent
          text-white
          mr-2
          align-middle
        "
      >
        <v-remixicon :name="workflow.icon" />
      </span>
      <p class="font-semibold inline-block text-lg flex-1 mr-4 align-middle">
        {{ workflow.name }}
      </p>
    </div>
    <ui-tabs v-model="state.activeTab" fill class="mx-4 mb-4">
      <ui-tab value="blocks">Blocks</ui-tab>
      <ui-tab value="data-schema">Data Columns</ui-tab>
    </ui-tabs>
    <!-- <div class="px-4 mb-2">
      <ui-input prepend-icon="riSearch2Line" class="w-full" placeholder="Search..." />
    </div> -->
    <ui-tab-panels
      v-model="state.activeTab"
      class="scroll bg-scroll overflow-auto px-4 flex-1"
      style="overflow: overlay"
    >
      <ui-tab-panel value="blocks">
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
      </ui-tab-panel>
      <ui-tab-panel value="data-schema" class="pt-1">
        <div class="mb-4 space-y-2">
          <transition-group name="list">
            <div
              v-for="(item, index) in state.dataSchema"
              :key="index"
              class="flex items-center list-item-transition"
            >
              <ui-input
                v-model="state.dataSchema[index]"
                class="mr-2"
                placeholder="Column name"
              />
              <button @click="state.dataSchema.splice(index, 1)">
                <v-remixicon name="riDeleteBin7Line" />
              </button>
            </div>
          </transition-group>
        </div>
        <ui-button variant="accent" @click="state.dataSchema.push('')">
          Add column
        </ui-button>
      </ui-tab-panel>
    </ui-tab-panels>
  </div>
</template>
<script setup>
import { reactive, watch } from 'vue';
import { tasks, categories } from '@/utils/shared';
import { debounce } from '@/utils/helper';

const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update-workflow']);

const taskList = Object.keys(tasks).reduce((arr, key) => {
  const task = tasks[key];

  (arr[task.category] = arr[task.category] || []).push({ id: key, ...task });

  return arr;
}, {});

const state = reactive({
  show: false,
  dataSchema: [],
  activeTab: 'blocks',
});

watch(
  () => props.workflow.id,
  () => {
    const data = props.workflow.dataSchema;

    state.dataSchema = Array.isArray(data) ? data : Object.values(data);
  },
  { immediate: true }
);
watch(
  () => state.dataSchema,
  debounce((value) => {
    const uniqueData = [...new Set(value)];
    emit('update-workflow', uniqueData);
  }, 500),
  { deep: true }
);
</script>

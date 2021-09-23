<template>
  <ui-card class="w-80 h-full sticky top-[10px]" padding="p-0">
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
      <ui-button icon>
        <v-remixicon name="riDeleteBin7Line" />
      </ui-button>
    </div>
    <ui-tabs v-model="state.activeTab" fill class="m-4">
      <ui-tab value="tasks">Tasks</ui-tab>
      <ui-tab value="data-schema">Data Columns</ui-tab>
    </ui-tabs>
    <ui-tab-panels
      v-model="state.activeTab"
      class="scroll bg-scroll overflow-auto pb-4 px-4"
      style="max-height: calc(100vh - 240px); overflow: overlay"
    >
      <ui-tab-panel value="tasks">
        <draggable
          :list="taskList"
          :sort="false"
          :group="{ name: 'tasks', pull: 'clone', put: false }"
          item-key="id"
          ghost-class="ghost"
          class="grid grid-cols-2 gap-2"
          @start="$emit('dragstart')"
          @end="$emit('dragend')"
        >
          <template #item="{ element }">
            <div
              :title="element.name"
              style="cursor: grab"
              class="select-none group p-4 rounded-lg bg-input transition"
            >
              <v-remixicon :name="element.icon" size="24" class="mb-3" />
              <p class="leading-tight text-overflow">
                {{ element.name }}
              </p>
            </div>
          </template>
        </draggable>
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
                class="mr-4"
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
  </ui-card>
</template>
<script setup>
/* eslint-disable no-undef */
import { reactive, watch } from 'vue';
import Draggable from 'vuedraggable';
import { tasks } from '@/utils/shared';
import { debounce } from '@/utils/helper';

const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['dragstart', 'dragend', 'update-workflow']);

const taskList = Object.keys(tasks)
  .map((id) => ({ id, isNewTask: true, ...tasks[id] }))
  .sort((a, b) => (a.name > b.name ? 1 : -1));

const state = reactive({
  dataSchema: [],
  activeTab: 'tasks',
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

<template>
  <div class="pb-4 mt-4">
    <div class="px-4">
      <p>Select a workflow</p>
      <ui-input
        v-model="query"
        prepend-icon="riSearch2Line"
        class="w-full"
        autocomplete="off"
        placeholder="Search..."
      />
    </div>
    <ui-list
      class="overflow-y-auto scroll px-4 mt-4"
      style="max-height: calc(100vh - 14rem)"
    >
      <ui-list-item
        v-for="workflow in filteredWorkflows"
        :key="workflow.id"
        small
        class="cursor-pointer"
        @click="$emit('select', workflow.id)"
      >
        <img
          v-if="workflow.icon?.startsWith('http')"
          :src="workflow.icon"
          class="overflow-hidden rounded-lg"
          style="height: 32px; width: 32px"
          alt="Can not display"
        />
        <span v-else class="p-2 rounded-lg bg-box-transparent">
          <v-remixicon :name="workflow.icon" size="20" />
        </span>
        <div class="ml-2 overflow-hidden flex-1">
          <p :title="workflow.name" class="text-overflow leading-tight">
            {{ workflow.name }}
          </p>
          <p
            :title="workflow.description"
            class="text-overflow text-gray-600 leading-tight text-sm"
          >
            {{ workflow.description }}
          </p>
        </div>
      </ui-list-item>
    </ui-list>
  </div>
</template>
<script setup>
import { shallowRef, computed } from 'vue';

const props = defineProps({
  workflows: {
    type: Array,
    default: () => [],
  },
});
defineEmits(['select']);

const query = shallowRef('');

const filteredWorkflows = computed(() => {
  const search = query.value.toLocaleLowerCase();

  return props.workflows.filter((workflow) =>
    workflow.name.toLocaleLowerCase().includes(search)
  );
});
</script>

<template>
  <ui-card
    class="w-full flex items-center space-x-2 hover:ring-2 hover:ring-gray-900"
  >
    <div
      to="/workflow/anu/edit"
      class="flex-1 cursor-pointer"
      @click="$emit('details', workflow)"
    >
      <p class="leading-tight">{{ workflow.name }}</p>
      <p class="leading-none text-gray-500">
        {{ dayjs(workflow.createdAt).fromNow() }}
      </p>
    </div>
    <button title="Execute" @click="$emit('execute', workflow)">
      <v-remixicon name="riPlayLine" />
    </button>
    <ui-popover class="h-6">
      <template #trigger>
        <button>
          <v-remixicon name="riMoreLine" />
        </button>
      </template>
      <ui-list class="w-40 space-y-1">
        <ui-list-item
          v-for="item in menu"
          :key="item.name"
          v-close-popover
          class="capitalize cursor-pointer"
          @click="$emit(item.name, workflow)"
        >
          <v-remixicon :name="item.icon" class="mr-2 -ml-1" />
          <span>{{ item.name }}</span>
        </ui-list-item>
      </ui-list>
    </ui-popover>
  </ui-card>
</template>
<script setup>
import dayjs from '@/lib/dayjs';

defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
});
defineEmits(['execute', 'rename', 'details', 'delete']);

const menu = [
  { name: 'rename', icon: 'riPencilLine' },
  { name: 'delete', icon: 'riDeleteBin7Line' },
];
</script>

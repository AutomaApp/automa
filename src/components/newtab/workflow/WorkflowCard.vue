<template>
  <ui-card class="hover:ring-accent hover:ring-2">
    <div class="mb-4 flex items-center">
      <span class="p-2 rounded-lg bg-box-transparent inline-block">
        <v-remixicon :name="workflow.icon" />
      </span>
      <div class="flex-grow"></div>
      <button @click="$emit('execute', workflow)">
        <v-remixicon name="riPlayLine" />
      </button>
      <ui-popover v-if="showDetails" class="ml-2 h-6">
        <template #trigger>
          <button>
            <v-remixicon name="riMoreLine" />
          </button>
        </template>
        <ui-list class="w-44 space-y-1">
          <ui-list-item
            v-close-popover
            class="cursor-pointer"
            @click="$emit('rename', workflow)"
          >
            <v-remixicon name="riPencilLine" class="mr-2 -ml-1" />
            <span>Rename</span>
          </ui-list-item>
          <ui-list-item
            v-close-popover
            class="text-red-500 cursor-pointer"
            @click="$emit('delete', workflow)"
          >
            <v-remixicon name="riDeleteBin7Line" class="mr-2 -ml-1" />
            <span>Delete</span>
          </ui-list-item>
        </ui-list>
      </ui-popover>
    </div>
    <router-link :to="`/workflows/${workflow.id}`">
      <p class="line-clamp leading-tight font-semibold" :title="workflow.name">
        {{ workflow.name }}
      </p>
      <p class="text-gray-600 dark:text-gray-200 leading-tight text-overflow">
        {{ formatDate() }}
      </p>
    </router-link>
  </ui-card>
</template>
<script setup>
/* eslint-disable no-undef */

import dayjs from '@/lib/dayjs';

const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
  showDetails: {
    type: Boolean,
    default: true,
  },
});
defineEmits(['delete', 'rename', 'execute']);

const formatDate = () => dayjs(props.workflow.createdAt).fromNow();
</script>

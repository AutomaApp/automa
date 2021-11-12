<template>
  <ui-card class="hover:ring-2 group hover:ring-accent">
    <div class="flex items-center mb-4">
      <span class="p-2 rounded-lg bg-box-transparent">
        <v-remixicon :name="data.icon || icon" />
      </span>
      <div class="flex-grow"></div>
      <button
        class="invisible group-hover:visible"
        @click="$emit('execute', data)"
      >
        <v-remixicon name="riPlayLine" />
      </button>
      <ui-popover v-if="showDetails" class="h-6 ml-2">
        <template #trigger>
          <button>
            <v-remixicon name="riMoreLine" />
          </button>
        </template>
        <ui-list class="w-36 space-y-1">
          <ui-list-item
            v-for="item in menu"
            :key="item.name"
            v-close-popover
            class="cursor-pointer"
            @click="$emit('menuSelected', { name: item.name, data })"
          >
            <v-remixicon :name="item.icon" class="mr-2 -ml-1" />
            <span class="capitalize">{{ item.name }}</span>
          </ui-list-item>
        </ui-list>
      </ui-popover>
    </div>
    <div class="cursor-pointer" @click="$emit('click', data)">
      <p class="line-clamp font-semibold leading-tight">
        {{ data.name }}
      </p>
      <p class="text-gray-600 dark:text-gray-200">{{ formatDate() }}</p>
    </div>
  </ui-card>
</template>
<script setup>
import dayjs from '@/lib/dayjs';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  icon: {
    type: String,
    default: 'riGlobalLine',
  },
  showDetails: {
    type: Boolean,
    default: true,
  },
  menu: {
    type: Array,
    default: () => [],
  },
});
defineEmits(['execute', 'click', 'menuSelected']);

let formattedDate = null;
const formatDate = () => {
  if (formattedDate) return formattedDate;

  formattedDate = dayjs(props.data.createdAt).fromNow();

  return formattedDate;
};
</script>

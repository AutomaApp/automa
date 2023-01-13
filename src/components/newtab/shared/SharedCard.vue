<template>
  <ui-card
    class="group flex flex-col hover:ring-2 hover:ring-accent dark:hover:ring-gray-200"
  >
    <slot name="header">
      <div class="mb-4 flex items-center">
        <ui-img
          v-if="data.icon?.startsWith('http')"
          :src="data.icon"
          class="overflow-hidden rounded-lg"
          style="height: 40px; width: 40px"
          alt="Can not display"
        />
        <span v-else class="bg-box-transparent rounded-lg p-2">
          <v-remixicon :name="data.icon || icon" />
        </span>
        <div class="grow"></div>
        <span
          v-if="data.isDisabled"
          class="text-sm text-gray-600 dark:text-gray-200"
        >
          Disabled
        </span>
        <button
          v-else-if="!disabled"
          class="invisible group-hover:visible"
          @click="$emit('execute', data)"
        >
          <v-remixicon name="riPlayLine" />
        </button>
        <ui-popover v-if="showDetails" class="ml-2 h-6">
          <template #trigger>
            <button>
              <v-remixicon name="riMoreLine" />
            </button>
          </template>
          <ui-list class="space-y-1" style="min-width: 150px">
            <ui-list-item
              v-for="item in menu"
              :key="item.id"
              v-close-popover
              v-bind="item.attrs || {}"
              class="cursor-pointer"
              @click="$emit('menuSelected', { id: item.id, data })"
            >
              <v-remixicon :name="item.icon" class="mr-2 -ml-1" />
              <span class="capitalize">{{ item.name }}</span>
            </ui-list-item>
          </ui-list>
        </ui-popover>
      </div>
    </slot>
    <div class="flex-1 cursor-pointer" @click="$emit('click', data)">
      <p class="line-clamp font-semibold leading-tight">
        {{ data.name }}
      </p>
      <p
        v-show="data.description"
        class="line-clamp mb-1 leading-tight text-gray-600 dark:text-gray-200"
      >
        {{ data.description }}
      </p>
    </div>
    <div class="flex items-center text-gray-600 dark:text-gray-200">
      <p class="flex-1">{{ state.date }}</p>
      <slot name="footer-content" />
    </div>
  </ui-card>
</template>
<script setup>
import { shallowReactive } from 'vue';
import dayjs from '@/lib/dayjs';

const props = defineProps({
  disabled: Boolean,
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

const state = shallowReactive({
  triggerText: null,
  date: dayjs(props.data.createdAt).fromNow(),
});
</script>

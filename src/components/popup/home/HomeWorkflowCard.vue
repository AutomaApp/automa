<template>
  <ui-card
    class="w-full flex items-center space-x-2 hover:ring-2 hover:ring-gray-900"
  >
    <div
      class="flex-1 text-overflow cursor-pointer"
      @click="$emit('details', workflow)"
    >
      <p class="leading-tight text-overflow">{{ workflow.name }}</p>
      <p class="leading-tight text-gray-500">
        {{ dayjs(workflow.createdAt).fromNow() }}
      </p>
    </div>
    <p v-if="workflow.isDisabled">Disabled</p>
    <button v-else title="Execute" @click="$emit('execute', workflow)">
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
          class="capitalize cursor-pointer"
          @click="$emit('update', { isDisabled: !workflow.isDisabled })"
        >
          <v-remixicon name="riToggleLine" class="mr-2 -ml-1" />
          <span>{{
            t(`common.${workflow.isDisabled ? 'enable' : 'disable'}`)
          }}</span>
        </ui-list-item>
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
import { useI18n } from 'vue-i18n';
import dayjs from '@/lib/dayjs';

defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
});
defineEmits(['execute', 'rename', 'details', 'delete', 'update']);

const { t } = useI18n();

const menu = [
  { name: 'rename', icon: 'riPencilLine' },
  { name: 'delete', icon: 'riDeleteBin7Line' },
];
</script>

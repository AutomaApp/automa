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
    <v-remixicon
      v-if="workflow.isProtected"
      name="riShieldKeyholeLine"
      class="text-green-600"
    />
    <ui-popover v-else class="h-6">
      <template #trigger>
        <button>
          <v-remixicon name="riMoreLine" />
        </button>
      </template>
      <ui-list class="space-y-1" style="min-width: 160px">
        <template v-if="tab === 'local'">
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
            class="capitalize cursor-pointer"
            @click="$emit('togglePin')"
          >
            <v-remixicon name="riPushpin2Line" class="mr-2 -ml-1" />
            <span>{{ pinned ? 'Unpin workflow' : 'Pin workflow' }}</span>
          </ui-list-item>
        </template>
        <ui-list-item
          v-for="item in filteredMenu"
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

const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
  tab: {
    type: String,
    default: 'local',
  },
  pinned: Boolean,
});
defineEmits(['execute', 'togglePin', 'rename', 'details', 'delete', 'update']);

const { t } = useI18n();

const menu = [
  { name: 'rename', icon: 'riPencilLine' },
  { name: 'delete', icon: 'riDeleteBin7Line' },
];
const filteredMenu = menu.filter(({ name }) => {
  if (name === 'rename' && props.tab !== 'local') return false;

  return true;
});
</script>

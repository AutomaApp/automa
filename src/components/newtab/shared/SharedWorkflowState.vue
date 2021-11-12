<template>
  <ui-card>
    <div class="flex items-center mb-4">
      <div class="flex-1 text-overflow mr-4">
        <p class="w-full mr-2 text-overflow">{{ data.state.name }}</p>
        <p
          class="w-full mr-2 text-gray-600 leading-tight text-overflow"
          :title="`Started at: ${formatDate(
            data.state.startedTimestamp,
            'DD MMM, hh:mm A'
          )}`"
        >
          {{ formatDate(data.state.startedTimestamp, 'relative') }}
        </p>
      </div>
      <ui-button
        v-if="data.state.tabId"
        icon
        class="mr-2"
        title="Open tab"
        @click="openTab"
      >
        <v-remixicon name="riExternalLinkLine" />
      </ui-button>
      <ui-button variant="accent" @click="stopWorkflow">
        <v-remixicon name="riStopLine" class="mr-2 -ml-1" />
        <span>Stop</span>
      </ui-button>
    </div>
    <div class="divide-y bg-box-transparent divide-y px-4 rounded-lg">
      <div
        v-for="block in getBlock()"
        :key="block.name"
        class="flex items-center py-2"
      >
        <v-remixicon :name="block.icon" />
        <p class="flex-1 ml-2 mr-4">{{ block.name }}</p>
        <ui-spinner color="text-accnet" size="20" />
      </div>
    </div>
  </ui-card>
</template>
<script setup>
import browser from 'webextension-polyfill';
import { sendMessage } from '@/utils/message';
import { tasks } from '@/utils/shared';
import dayjs from '@/lib/dayjs';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});

function getBlock() {
  if (!props.data.state.currentBlock) return [];

  if (Array.isArray(props.data.state.currentBlock)) {
    return props.data.state.currentBlock.map((item) => {
      if (tasks[item.name]) return tasks[item.name];

      return item;
    });
  }

  return [tasks[props.data.state.currentBlock.name]];
}
function formatDate(date, format) {
  if (format === 'relative') return dayjs(date).fromNow();

  return dayjs(date).format(format);
}
function openTab() {
  browser.tabs.update(props.data.state.tabId, { active: true });
}
function stopWorkflow() {
  sendMessage(
    props.data.isCollection ? 'collection:stop' : 'workflow:stop',
    props.data.id,
    'background'
  );
}
</script>

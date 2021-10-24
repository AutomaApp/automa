<template>
  <ui-card>
    <div class="flex items-center mb-4">
      <div class="flex-1 text-overflow mr-4">
        <p class="w-full mr-2 text-overflow">{{ state.name }}</p>
        <p
          class="w-full mr-2 text-gray-600 leading-tight text-overflow"
          :title="`Started at: ${formatDate(
            state.startedTimestamp,
            'DD MMM, hh:mm A'
          )}`"
        >
          {{ formatDate(state.startedTimestamp, 'relative') }}
        </p>
      </div>
      <ui-button
        v-if="state.tabId"
        icon
        class="mr-2"
        title="Open tab"
        @click="openTab"
      >
        <v-remixicon name="riExternalLinkLine" />
      </ui-button>
      <ui-button variant="accent" @click="stopWorkflow(item)">
        <v-remixicon name="riStopLine" class="mr-2 -ml-1" />
        <span>Stop</span>
      </ui-button>
    </div>
    <div class="flex items-center bg-box-transparent px-4 py-2 rounded-lg">
      <template v-if="state.currentBlock">
        <v-remixicon :name="getBlock().icon" />
        <p class="flex-1 ml-2 mr-4">{{ getBlock().name }}</p>
        <ui-spinner color="text-accnet" size="20" />
      </template>
      <p v-else>No block</p>
    </div>
  </ui-card>
</template>
<script setup>
import browser from 'webextension-polyfill';
import { sendMessage } from '@/utils/message';
import { tasks } from '@/utils/shared';
import dayjs from '@/lib/dayjs';

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  state: {
    type: Object,
    default: () => ({}),
  },
});

function getBlock() {
  if (!props.state.currentBlock) return {};

  return tasks[props.state.currentBlock.name];
}
function formatDate(date, format) {
  if (format === 'relative') return dayjs(date).fromNow();

  return dayjs(date).format(format);
}
function openTab() {
  browser.tabs.update(props.state.tabId, { active: true });
}
function stopWorkflow() {
  sendMessage('workflow:stop', props.id, 'background');
}
</script>

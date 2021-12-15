<template>
  <div class="grid grid-cols-2 gap-4">
    <ui-card v-for="item in data" :key="item">
      <div class="flex items-center mb-4">
        <div class="flex-1 text-overflow mr-4">
          <p class="w-full mr-2 text-overflow">{{ item.state.name }}</p>
          <p
            class="w-full mr-2 text-gray-600 leading-tight text-overflow"
            :title="`Started at: ${formatDate(
              item.state.startedTimestamp,
              'DD MMM, hh:mm A'
            )}`"
          >
            {{ formatDate(item.state.startedTimestamp, 'relative') }}
          </p>
        </div>
        <ui-button
          v-if="item.state.tabId"
          icon
          class="mr-2"
          title="Open tab"
          @click="openTab(item.state.tabId)"
        >
          <v-remixicon name="riExternalLinkLine" />
        </ui-button>
        <ui-button variant="accent" @click="stopWorkflow(item)">
          <v-remixicon name="riStopLine" class="mr-2 -ml-1" />
          <span>{{ t('common.stop') }}</span>
        </ui-button>
      </div>
      <div class="flex items-center bg-box-transparent px-4 py-2 rounded-lg">
        <template v-if="item.state.currentBlock">
          <v-remixicon :name="getBlock(item).icon" />
          <p class="flex-1 ml-2 mr-4">{{ getBlock(item).name }}</p>
          <ui-spinner color="text-accent" size="20" />
        </template>
        <p v-else>{{ t('message.noBlock') }}</p>
      </div>
    </ui-card>
  </div>
</template>
<script setup>
import browser from 'webextension-polyfill';
import { useI18n } from 'vue-i18n';
import { sendMessage } from '@/utils/message';
import { tasks } from '@/utils/shared';
import dayjs from '@/lib/dayjs';

defineProps({
  data: {
    type: Array,
    default: () => [],
  },
});

const { t } = useI18n();

function getBlock(item) {
  if (!item.state.currentBlock) return {};

  return tasks[item.state.currentBlock.name];
}
function formatDate(date, format) {
  if (format === 'relative') return dayjs(date).fromNow();

  return dayjs(date).format(format);
}
function openTab(tabId) {
  browser.tabs.update(tabId, { active: true });
}
function stopWorkflow(item) {
  sendMessage('workflow:stop', item, 'background');
}
</script>

<template>
  <div class="grid grid-cols-2 gap-4">
    <ui-card v-for="item in data" :key="item">
      <div class="mb-4 flex items-center">
        <div class="text-overflow mr-4 flex-1">
          <p class="text-overflow mr-2 w-full">{{ item.state.name }}</p>
          <p
            class="text-overflow mr-2 w-full leading-tight text-gray-600 dark:text-gray-200"
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
      <div class="bg-box-transparent flex items-center rounded-lg px-4 py-2">
        <template v-if="item.state.currentBlock">
          <v-remixicon :name="getBlock(item).icon" />
          <p class="ml-2 mr-4 flex-1">{{ getBlock(item).name }}</p>
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
import { getBlocks } from '@/utils/getSharedData';
import dayjs from '@/lib/dayjs';
import RendererWorkflowService from '@/service/renderer/RendererWorkflowService';

defineProps({
  data: {
    type: Array,
    default: () => [],
  },
});

const { t } = useI18n();
const blocks = getBlocks();

function getBlock(item) {
  if (!item.state.currentBlock) return {};

  return blocks[item.state.currentBlock.name];
}
function formatDate(date, format) {
  if (format === 'relative') return dayjs(date).fromNow();

  return dayjs(date).format(format);
}
function openTab(tabId) {
  browser.tabs.update(tabId, { active: true });
}
function stopWorkflow(item) {
  RendererWorkflowService.stopWorkflowExecution(item);
}
</script>

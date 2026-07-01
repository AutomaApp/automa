<template>
  <ui-card>
    <div class="mb-4 flex items-center">
      <div class="text-overflow mr-4 flex-1">
        <p class="text-overflow mr-2 w-full">{{ data.state.name }}</p>
        <p
          class="text-overflow mr-2 w-full leading-tight text-gray-600 dark:text-gray-200"
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
        <span>{{ t('common.stop') }}</span>
      </ui-button>
    </div>
    <div class="bg-box-transparent divide-y rounded-lg px-4">
      <div
        v-for="block in data.state.currentBlock"
        :key="block.id || block.name"
        class="flex items-center py-2"
      >
        <v-remixicon :name="blocks[block.name].icon" />
        <p class="text-overflow ml-2 mr-4 flex-1">
          {{ blocks[block.name].name }}
        </p>
        <ui-spinner color="text-accent" size="20" />
      </div>
    </div>
    <div
      v-if="data.parentState"
      class="mt-2 rounded-lg bg-yellow-200 py-2 px-4 text-sm"
    >
      {{ t('workflow.state.executeBy', { name: data.parentState.name }) }}
      <span class="lowercase">
        {{
          data.parentState.isCollection
            ? t('common.collection')
            : t('common.workflow')
        }}
      </span>
    </div>
  </ui-card>
</template>
<script setup>
import browser from 'webextension-polyfill';
import { useI18n } from 'vue-i18n';
import { getBlocks } from '@/utils/getSharedData';
import RendererWorkflowService from '@/service/renderer/RendererWorkflowService';
import dayjs from '@/lib/dayjs';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});

const blocks = getBlocks();
const { t } = useI18n();

function formatDate(date, format) {
  if (format === 'relative') return dayjs(date).fromNow();

  return dayjs(date).format(format);
}
function openTab() {
  browser.tabs.update(props.data.state.tabId, { active: true });
}
function stopWorkflow() {
  RendererWorkflowService.stopWorkflowExecution(props.data.id);
}
</script>

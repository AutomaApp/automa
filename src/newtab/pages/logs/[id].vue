<template>
  <div class="container pt-8 pb-4">
    <div class="flex items-center mb-8">
      <div>
        <h1 class="text-2xl max-w-sm text-overflow font-semibold">
          {{ activeLog.name }}
        </h1>
        <p class="text-gray-600">
          <span class="capitalize">
            {{
              activeLog.status === 'success' ? 'succeeded' : activeLog.status
            }}
          </span>
          <span
            :title="dayjs(activeLog.startedAt).format('DD MMM YYYY, hh:mm A')"
          >
            on {{ dayjs(activeLog.startedAt).format('DD MMM') }}
          </span>
          in {{ countDuration(activeLog.startedAt, activeLog.endedAt) }}
        </p>
      </div>
      <div class="flex-grow"></div>
      <ui-input prepend-icon="riSearch2Line" placeholder="Search..." />
    </div>
    <div class="flex items-start">
      <ui-list class="w-7/12 mr-6">
        <ui-list-item v-for="(item, index) in activeLog.history" :key="index">
          <span
            :title="item.message || item.type"
            :class="logsType[item.type].color"
            class="p-1 rounded-lg align-middle inline-block mr-2"
          >
            <v-remixicon :name="logsType[item.type].icon" size="20" />
          </span>
          <p class="flex-1 text-overflow">
            {{ item.name }}
          </p>
          <p class="text-gray-600">
            {{ countDuration(0, item.duration || 0) }}
          </p>
        </ui-list-item>
      </ui-list>
      <div class="w-5/12 logs-details sticky top-10">
        <logs-data-viewer :log="activeLog" />
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Log from '@/models/log';
import dayjs from '@/lib/dayjs';
import { countDuration } from '@/utils/helper';
import LogsDataViewer from '@/components/newtab/logs/LogsDataViewer.vue';

const logsType = {
  success: {
    color: 'bg-green-200',
    icon: 'riCheckLine',
  },
  stop: {
    color: 'bg-yellow-200',
    icon: 'riStopLine',
  },
  error: {
    color: 'bg-red-200',
    icon: 'riErrorWarningLine',
  },
  finish: {
    color: 'bg-blue-200',
    icon: 'riFlagLine',
  },
};

const route = useRoute();

const activeLog = computed(() => Log.find(route.params.id));

setTimeout(() => {
  console.log(activeLog.value);
}, 2000);
</script>
<style>
.logs-details .my-editor {
  max-height: calc(100vh - 12rem);
}
</style>

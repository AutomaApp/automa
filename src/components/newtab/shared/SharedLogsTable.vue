<template>
  <div class="logs-table">
    <transition-expand>
      <div v-if="state.selected.length > 0" class="border-x border-t px-4 py-2">
        <ui-button @click="stopSelectedWorkflow"> Stop selected </ui-button>
      </div>
    </transition-expand>
    <table class="w-full">
      <tbody class="divide-y dark:divide-gray-800">
        <tr v-for="item in running" :key="item.id" class="p-2 border">
          <td v-if="!hideSelect" class="w-8">
            <ui-checkbox
              :model-value="state.selected.includes(item.id)"
              class="align-text-bottom"
              @change="toggleSelectedLog($event, item.id)"
            />
          </td>
          <td class="w-4/12">
            <router-link
              :to="`/logs/${item.id}/running`"
              class="inline-block text-overflow w-full align-middle min-h"
              style="min-height: 28px"
            >
              {{ item.state.name }}
            </router-link>
          </td>
          <td
            class="log-time w-2/12 dark:text-gray-200"
            :title="t('log.duration')"
          >
            <v-remixicon name="riTimerLine"></v-remixicon>
            <span>{{
              countDuration(item.state.startedTimestamp, Date.now())
            }}</span>
          </td>
          <td title="Executing block">
            <ui-spinner color="text-accent" size="20" />
            <span class="align-middle inline-block ml-3">
              {{ t(`workflow.blocks.${item.state.currentBlock[0].name}.name`) }}
            </span>
          </td>
          <td class="text-right">
            <span
              class="inline-block py-1 w-16 text-center text-sm rounded-md dark:text-black bg-blue-300"
            >
              {{ t('common.running') }}
            </span>
          </td>
          <td class="text-right">
            <ui-button small class="text-sm" @click="stopWorkflow(item.id)">
              {{ t('common.stop') }}
            </ui-button>
          </td>
        </tr>
        <tr v-for="log in logs" :key="log.id" class="hoverable">
          <slot name="item-prepend" :log="log" />
          <td
            class="text-overflow w-4/12"
            style="min-width: 140px; max-width: 330px"
          >
            <router-link
              :to="`/logs/${log.id}`"
              class="inline-block text-overflow w-full align-middle min-h"
              style="min-height: 28px"
            >
              {{ log.name }}
            </router-link>
          </td>
          <td class="log-time w-3/12 dark:text-gray-200">
            <v-remixicon
              :title="t('log.startedDate')"
              name="riCalendarLine"
              class="mr-2 inline-block align-middle"
            />
            <span :title="formatDate(log.startedAt, 'DD MMM YYYY, hh:mm A')">
              {{ formatDate(log.startedAt, 'relative') }}
            </span>
          </td>
          <td
            class="log-time w-2/12 dark:text-gray-200"
            :title="t('log.duration')"
          >
            <v-remixicon name="riTimerLine"></v-remixicon>
            <span>{{ countDuration(log.startedAt, log.endedAt) }}</span>
          </td>
          <td class="text-right">
            <span
              :class="statusColors[log.status]"
              :title="log.status === 'error' ? getErrorMessage(log) : null"
              class="inline-block py-1 w-16 text-center text-sm rounded-md dark:text-black"
            >
              {{ t(`logStatus.${log.status}`) }}
            </span>
          </td>
          <slot name="item-append" :log="log" />
        </tr>
        <slot name="table:append" />
      </tbody>
    </table>
  </div>
</template>
<script setup>
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { sendMessage } from '@/utils/message';
import { countDuration } from '@/utils/helper';
import dayjs from '@/lib/dayjs';

defineProps({
  logs: {
    type: Array,
    default: () => [],
  },
  running: {
    type: Array,
    default: () => [],
  },
  hideSelect: Boolean,
});

const { t, te } = useI18n();

const statusColors = {
  error: 'bg-red-200 dark:bg-red-300',
  success: 'bg-green-200 dark:bg-green-300',
  stopped: 'bg-yellow-200 dark:bg-yellow-300',
};
const state = reactive({
  selected: [],
});

function stopWorkflow(stateId) {
  sendMessage('workflow:stop', stateId, 'background');
}
function toggleSelectedLog(selected, id) {
  if (selected) {
    state.selected.push(id);
    return;
  }

  const index = state.selected.indexOf(id);

  if (index !== -1) state.selected.splice(index, 1);
}
function formatDate(date, format) {
  if (format === 'relative') return dayjs(date).fromNow();

  return dayjs(date).format(format);
}
function getErrorMessage({ message }) {
  const messagePath = `log.messages.${message}`;

  if (message && te(messagePath)) {
    return t(messagePath);
  }

  return '';
}
function stopSelectedWorkflow() {
  state.selected.forEach((id) => {
    stopWorkflow(id);
  });
  state.selected = [];
}
</script>
<style scoped>
.log-time svg {
  @apply mr-2;
}
.log-time svg,
.log-time span {
  display: inline-block;
  vertical-align: middle;
}
</style>

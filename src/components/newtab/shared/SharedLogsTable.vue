<template>
  <table>
    <tbody class="divide-y dark:divide-gray-800">
      <tr v-for="log in logs" :key="log.id" class="hoverable">
        <slot name="item-prepend" :log="log" />
        <td class="text-overflow" style="min-width: 140px; max-width: 330px">
          <router-link
            :to="`/logs/${log.id}`"
            class="inline-block text-overflow w-full align-middle"
          >
            {{ log.name }}
          </router-link>
        </td>
        <td class="log-time dark:text-gray-200">
          <v-remixicon
            :title="t('log.startedDate')"
            name="riCalendarLine"
            class="mr-2 inline-block align-middle"
          />
          <span :title="formatDate(log.startedAt, 'DD MMM YYYY, hh:mm A')">
            {{ formatDate(log.startedAt, 'relative') }}
          </span>
        </td>
        <td class="log-time dark:text-gray-200" :title="t('log.duration')">
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
    </tbody>
  </table>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { countDuration } from '@/utils/helper';
import dayjs from '@/lib/dayjs';

defineProps({
  logs: {
    type: Array,
    default: () => [],
  },
});

const { t, te } = useI18n();

const statusColors = {
  error: 'bg-red-200 dark:bg-red-300',
  success: 'bg-green-200 dark:bg-green-300',
  stopped: 'bg-yellow-200 dark:bg-yellow-300',
};

function formatDate(date, format) {
  if (format === 'relative') return dayjs(date).fromNow();

  return dayjs(date).format(format);
}
function getErrorMessage({ history, message }) {
  const messagePath = `log.messages.${message}`;

  if (message && te(messagePath)) {
    return t(messagePath);
  }

  const lastHistory = history[history.length - 1];

  return lastHistory && lastHistory.type === 'error'
    ? lastHistory.message
    : null;
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

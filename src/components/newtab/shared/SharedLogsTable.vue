<template>
  <table>
    <tbody class="divide-y">
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
        <td class="log-time">
          <v-remixicon
            title="Started date"
            name="riCalendarLine"
            class="mr-2 inline-block align-middle"
          />
          <span :title="formatDate(log.startedAt, 'DD MMM YYYY, hh:mm A')">
            {{ formatDate(log.startedAt, 'relative') }}
          </span>
        </td>
        <td class="log-time" title="Duration">
          <v-remixicon name="riTimerLine"></v-remixicon>
          <span>{{ countDuration(log.startedAt, log.endedAt) }}</span>
        </td>
        <td class="text-right">
          <span
            :class="statusColors[log.status]"
            class="inline-block py-1 w-16 text-center text-sm rounded-lg"
          >
            {{ log.status }}
          </span>
        </td>
        <slot name="item-append" :log="log" />
      </tr>
    </tbody>
  </table>
</template>
<script setup>
import { countDuration } from '@/utils/helper';
import dayjs from '@/lib/dayjs';

defineProps({
  logs: {
    type: Array,
    default: () => [],
  },
});

const statusColors = {
  error: 'bg-red-200',
  success: 'bg-green-200',
  stopped: 'bg-yellow-200',
};

function formatDate(date, format) {
  if (format === 'relative') return dayjs(date).fromNow();

  return dayjs(date).format(format);
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

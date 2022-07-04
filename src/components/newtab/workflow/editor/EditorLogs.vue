<template>
  <div
    v-if="(!logs || logs.length === 0) && workflowStates.length === 0"
    class="text-center"
  >
    <img src="@/assets/svg/files-and-folder.svg" class="mx-auto max-w-sm" />
    <p class="text-xl font-semibold">{{ t('message.noData') }}</p>
  </div>
  <shared-logs-table
    :logs="logs"
    :running="workflowStates"
    hide-select
    class="w-full"
  >
    <template #item-append="{ log: itemLog }">
      <td class="text-right">
        <v-remixicon
          name="riDeleteBin7Line"
          class="inline-block text-red-500 cursor-pointer dark:text-red-400"
          @click="deleteLog(itemLog.id)"
        />
      </td>
    </template>
  </shared-logs-table>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import dbLogs from '@/db/logs';
import { useLiveQuery } from '@/composable/liveQuery';
import SharedLogsTable from '@/components/newtab/shared/SharedLogsTable.vue';

const props = defineProps({
  workflowId: {
    type: String,
    default: '',
  },
  workflowStates: {
    type: Array,
    default: () => [],
  },
});

const { t } = useI18n();

const logs = useLiveQuery(() =>
  dbLogs.items
    .where('workflowId')
    .equals(props.workflowId)
    .reverse()
    .limit(15)
    .sortBy('endedAt')
);

function deleteLog(logId) {
  dbLogs.items.delete(logId).then(() => {
    dbLogs.ctxData.where('logId').equals(logId).delete();
    dbLogs.histories.where('logId').equals(logId).delete();
    dbLogs.logsData.where('logId').equals(logId).delete();
  });
}
</script>

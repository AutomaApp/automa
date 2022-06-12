<template>
  <div class="container pt-8 pb-4">
    <h1 class="text-2xl font-semibold mb-8">{{ t('common.dashboard') }}</h1>
    <div class="grid gap-4 mb-8 2xl:grid-cols-5 grid-cols-4">
      <p
        v-if="workflows.length === 0"
        class="text-center text-gray-600 dark:text-gray-200"
      >
        {{ t('message.noData') }}
      </p>
      <shared-card
        v-for="workflow in workflows"
        :key="workflow.id"
        :data="workflow"
        :show-details="false"
        style="max-width: 250px"
        @execute="executeWorkflow"
        @click="$router.push(`/workflows/${$event.id}`)"
      />
    </div>
    <div class="mb-2 flex items-center justify-between">
      <p class="font-semibold inline-block">{{ t('common.log', 2) }}</p>
      <router-link to="/logs" class="text-gray-600 dark:text-gray-200 text-sm">
        {{ t('home.viewAll') }}
      </router-link>
    </div>
    <p
      v-if="logs?.length === 0"
      class="text-center text-gray-600 dark:text-gray-200"
    >
      {{ t('message.noData') }}
    </p>
    <shared-logs-table
      :logs="logs || []"
      :running="workflowState"
      class="w-full"
    />
  </div>
</template>
<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { sendMessage } from '@/utils/message';
import { useLiveQuery } from '@/composable/liveQuery';
import dbLogs from '@/db/logs';
import Workflow from '@/models/workflow';
import SharedCard from '@/components/newtab/shared/SharedCard.vue';
import SharedLogsTable from '@/components/newtab/shared/SharedLogsTable.vue';

const { t } = useI18n();
const store = useStore();

const logs = useLiveQuery(() =>
  dbLogs.items.orderBy('endedAt').reverse().limit(10).toArray()
);
const workflows = computed(() =>
  Workflow.query().orderBy('createdAt', 'desc').limit(3).get()
);
const workflowState = computed(() => store.state.workflowState);

function executeWorkflow(workflow) {
  sendMessage('workflow:execute', workflow, 'background');
}
</script>

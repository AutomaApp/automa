<template>
  <div class="container pt-8 pb-4">
    <h1 class="text-2xl font-semibold mb-8">{{ t('common.dashboard') }}</h1>
    <div class="flex items-start">
      <div class="w-8/12 mr-8">
        <div class="grid gap-4 mb-8 2xl:grid-cols-4 grid-cols-3">
          <p v-if="workflows.length === 0" class="text-center text-gray-600">
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
        <div>
          <div class="mb-2 flex items-center justify-between">
            <p class="font-semibold inline-block">Logs</p>
            <router-link
              to="/logs"
              class="text-gray-600 text-sm dark:text-gray-200"
            >
              {{ t('home.viewAll') }}
            </router-link>
          </div>
          <p v-if="logs.length === 0" class="text-center text-gray-600">
            {{ t('message.noData') }}
          </p>
          <shared-logs-table :logs="logs" class="w-full" />
        </div>
      </div>
      <div class="w-4/12 space-y-4">
        <p v-if="workflowState.length === 0" class="text-center text-gray-600">
          {{ t('message.noData') }}
        </p>
        <shared-workflow-state
          v-for="item in workflowState"
          v-bind="{ data: item }"
          :key="item.id"
          class="w-full"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { sendMessage } from '@/utils/message';
import Log from '@/models/log';
import Workflow from '@/models/workflow';
import SharedCard from '@/components/newtab/shared/SharedCard.vue';
import SharedLogsTable from '@/components/newtab/shared/SharedLogsTable.vue';
import SharedWorkflowState from '@/components/newtab/shared/SharedWorkflowState.vue';

const { t } = useI18n();
const store = useStore();

const workflows = computed(() =>
  Workflow.query().orderBy('createdAt', 'desc').limit(3).get()
);
const logs = computed(() =>
  Log.query()
    .where(({ isInCollection, isChildLog }) => !isInCollection && !isChildLog)
    .orderBy('startedAt', 'desc')
    .limit(10)
    .get()
);
const workflowState = computed(() =>
  store.state.workflowState.filter(({ isInCollection }) => !isInCollection)
);

function executeWorkflow(workflow) {
  sendMessage('workflow:execute', workflow, 'background');
}
</script>

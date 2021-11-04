<template>
  <div class="container pt-8 pb-4">
    <h1 class="text-2xl font-semibold mb-8">Dashboard</h1>
    <div class="flex items-start">
      <div class="w-8/12 mr-8">
        <div class="grid gap-4 mb-8 grid-cols-3">
          <p v-if="workflows.length === 0" class="text-center text-gray-600">
            No data
          </p>
          <workflow-card
            v-for="workflow in workflows"
            :key="workflow.id"
            :workflow="workflow"
            :show-details="false"
            @execute="executeWorkflow"
          />
        </div>
        <div>
          <div class="mb-2 flex items-center justify-between">
            <p class="font-semibold inline-block">Logs</p>
            <router-link
              to="/logs"
              class="text-gray-600 text-sm dark:text-gray-200"
            >
              View all
            </router-link>
          </div>
          <p v-if="logs.length === 0" class="text-center text-gray-600">
            No data
          </p>
          <shared-logs-table :logs="logs" class="w-full" />
        </div>
      </div>
      <div class="w-4/12 space-y-4">
        <p v-if="workflowState.length === 0" class="text-center text-gray-600">
          No data
        </p>
        <shared-workflow-state
          v-for="item in workflowState"
          :id="item.id"
          :key="item.id"
          :state="item.state"
          class="w-full"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { sendMessage } from '@/utils/message';
import Log from '@/models/log';
import Workflow from '@/models/workflow';
import WorkflowCard from '@/components/newtab/workflow/WorkflowCard.vue';
import SharedLogsTable from '@/components/newtab/shared/SharedLogsTable.vue';
import SharedWorkflowState from '@/components/newtab/shared/SharedWorkflowState.vue';

const store = useStore();

const workflows = computed(() =>
  Workflow.query().orderBy('createdAt', 'desc').limit(3).get()
);
const logs = computed(() =>
  Log.query().orderBy('startedAt', 'desc').limit(10).get()
);
const workflowState = computed(() => store.state.workflowState);

function executeWorkflow(workflow) {
  sendMessage('workflow:execute', workflow, 'background');
}
</script>

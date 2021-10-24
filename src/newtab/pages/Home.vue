<template>
  <div class="container pt-8 pb-4">
    <h1 class="text-2xl font-semibold mb-8">Dashboard</h1>
    <div class="flex items-start">
      <div class="w-7/12 mr-8">
        <div class="grid gap-4 mb-8 grid-cols-3">
          <workflow-card
            v-for="workflow in workflows"
            :key="workflow.id"
            v-bind="{ workflow }"
            :show-details="false"
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
          <logs-table :logs="logs" class="w-full" />
        </div>
      </div>
      <ui-card class="flex-1">
        <!-- <p class="mb-4">Running workflow</p> -->
        <div class="flex items-center mb-4">
          <span class="p-2 rounded-full bg-accent text-white inline-block">
            <v-remixicon name="riGlobalLine" />
          </span>
          <div class="flex-grow"></div>
          <ui-button class="mr-3">
            <v-remixicon class="-ml-1 mr-1" name="riPauseLine" />
            <span>Pause</span>
          </ui-button>
          <ui-button variant="accent">
            <v-remixicon class="-ml-1 mr-1" name="riStopLine" />
            <span>Stop</span>
          </ui-button>
        </div>
        <p class="mb-2 text-lg font-semibold">Workflow name</p>
        <shared-task-list class="bg-gray-100 rounded-lg p-2" :tasks="tasks" />
      </ui-card>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue';
import Workflow from '@/models/workflow';
import Log from '@/models/log';
import LogsTable from '@/components/newtab/LogsTable.vue';
import SharedTaskList from '@/components/shared/SharedTaskList.vue';
import WorkflowCard from '@/components/newtab/workflow/WorkflowCard.vue';

const tasks = [
  { name: 'Open website', status: 'success' },
  { name: 'Get data', status: 'success' },
  { name: 'Close web', status: 'running' },
];

const workflows = computed(() =>
  Workflow.query().orderBy('createdAt', 'desc').limit(3).get()
);
const logs = computed(() =>
  Log.query().orderBy('startedAt', 'desc').limit(10).get()
);
</script>

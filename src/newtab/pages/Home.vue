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
          <table class="w-full table-fixed">
            <tbody class="divide-y">
              <tr v-for="i in 10" :key="i" class="hoverable">
                <td class="p-2 w-6/12 text-overflow">
                  Lorem ipsum dolor sit amet
                </td>
                <td class="p-2 text-gray-600 dark:text-gray-200">
                  {{ i + 1 }} Days ago
                </td>
                <td class="p-2 text-right">
                  <span
                    class="
                      inline-block
                      py-1
                      px-2
                      text-sm text-green-700
                      bg-green-500/10
                      rounded-lg
                    "
                  >
                    Success
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
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
</script>

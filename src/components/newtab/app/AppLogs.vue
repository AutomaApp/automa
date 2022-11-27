<template>
  <ui-modal
    v-model="state.show"
    custom-content
    content-position="start"
    @close="clearState"
  >
    <ui-card class="w-full mt-8" style="max-width: 1400px; min-height: 600px">
      <app-logs-items
        v-if="!state.logId"
        :workflow-id="state.workflowId"
        @select="onSelectLog"
        @close="clearState"
      />
      <app-logs-item-running
        v-else-if="state.runningWorkflow"
        :log-id="state.logId"
        @close="closeItemPage"
      />
      <app-logs-item v-else :log-id="state.logId" @close="closeItemPage" />
    </ui-card>
  </ui-modal>
</template>
<script setup>
import { reactive } from 'vue';
import emitter from '@/lib/mitt';
import AppLogsItem from './AppLogsItem.vue';
import AppLogsItems from './AppLogsItems.vue';
import AppLogsItemRunning from './AppLogsItemRunning.vue';

const state = reactive({
  logId: '',
  source: '',
  show: false,
  workflowId: '',
  runningWorkflow: false,
});

emitter.on('ui:logs', (event = {}) => {
  Object.assign(state, event);
});

function clearState() {
  state.show = false;
  state.logId = '';
  state.source = '';
  state.runningWorkflow = false;
}
function closeItemPage(closeModal = false) {
  state.logId = '';

  if (closeModal) clearState();
}
function onSelectLog({ id, type }) {
  state.runningWorkflow = type === 'running';
  state.logId = id;
}
</script>

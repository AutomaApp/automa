<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <ui-select
      :model-value="data.workflowId"
      :placeholder="t('workflow.blocks.execute-workflow.select')"
      class="mt-4 w-full"
      @change="updateData({ workflowId: $event })"
    >
      <option
        v-for="workflow in workflows"
        :key="workflow.id"
        :value="workflow.id"
      >
        {{ workflow.name }}
      </option>
    </ui-select>
    <div class="mb-8 log-data">
      <template v-if="data.workflowId">
        <p class="mt-4 mb-2">
          {{ t('workflow.blocks.log-data.data') }}
        </p>
        <insert-workflow-data :data="data" variables @update="updateData" />
      </template>
    </div>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { useWorkflowStore } from '@/stores/workflow';
import InsertWorkflowData from './InsertWorkflowData.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();
const workflowStore = useWorkflowStore();

const workflows = workflowStore.getWorkflows.sort((a, b) =>
  a.name > b.name ? 1 : -1
);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
<style>
.log-data .block-variable {
  margin-top: 4px;
}
</style>

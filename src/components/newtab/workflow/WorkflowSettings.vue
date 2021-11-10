<template>
  <div class="mb-4">
    <p class="mb-1">On workflow error</p>
    <div class="space-x-4">
      <ui-radio
        v-for="item in onError"
        :key="item.id"
        :model-value="workflow.settings.onError"
        :value="item.id"
        class="mr-4"
        @change="updateWorkflow({ onError: $event })"
      >
        {{ item.name }}
      </ui-radio>
    </div>
  </div>
  <div>
    <p class="mb-1">Workflow timeout (milliseconds)</p>
    <ui-input
      :model-value="workflow.settings.timeout"
      type="number"
      @change="updateWorkflow({ timeout: +$event })"
    />
  </div>
</template>
<script setup>
const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update']);

const onError = [
  { id: 'keep-running', name: 'Keep workflow running' },
  { id: 'stop-workflow', name: 'Stop workflow' },
];

function updateWorkflow(data) {
  emit('update', {
    settings: { ...props.workflow.settings, ...data },
  });
}
</script>

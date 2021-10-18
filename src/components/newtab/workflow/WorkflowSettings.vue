<template>
  <p class="font-semibold mb-2">On workflow error</p>
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

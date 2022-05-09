<template>
  <div class="space-y-2">
    <ui-input
      :model-value="data.time"
      label="Delay time (millisecond)"
      class="w-full"
      type="text"
      @change="updateData({ time: $event })"
    />
  </div>
</template>
<script setup>
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>

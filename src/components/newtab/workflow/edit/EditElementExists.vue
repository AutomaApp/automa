<template>
  <ui-input
    :model-value="data.selector"
    label="Element selector"
    class="mb-1 w-full"
    @change="updateData({ selector: $event })"
  />
  <div class="flex space-x-2">
    <ui-input
      :model-value="data.tryCount"
      class="flex-1"
      type="number"
      title="Try check element exists"
      label="Try for"
      min="1"
      @change="updateData({ tryCount: +$event })"
    />
    <ui-input
      :model-value="data.timeout"
      label="Timeout(ms)"
      title="Timeout for each try"
      class="flex-1"
      type="number"
      min="200"
      @change="updateData({ timeout: +$event })"
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

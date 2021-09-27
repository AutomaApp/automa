<template>
  <ui-select
    :model-value="data.type || 'manual'"
    placeholder="Trigger workflow"
    class="w-full"
    @change="updateData({ type: $event })"
  >
    <option value="manual">Manual</option>
    <option value="interval">Interval</option>
  </ui-select>
  <div v-if="data.type === 'interval'" class="flex items-center">
    <ui-input
      :model-value="data.interval || '60'"
      type="number"
      class="mt-1 w-full mr-2"
      label="Interval (minutes)"
      placeholder="5-120"
      @change="updateInputValue($event, { key: 'interval', min: 5, max: 120 })"
    />
    <ui-input
      :model-value="data.delay || '5'"
      type="number"
      class="mt-1 w-full"
      label="Delay (minutes)"
      placeholder="0-20"
      @change="updateInputValue($event, { key: 'delay', min: 0, max: 20 })"
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
function updateInputValue(value, { key, min, max }) {
  let num = +value;

  if (num < min) num = min;
  else if (num > max) num = max;

  updateData({ [key]: num });
}
</script>

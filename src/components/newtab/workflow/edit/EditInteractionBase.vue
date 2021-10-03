<template>
  <ui-textarea
    :model-value="data.description"
    autoresize
    placeholder="Description"
    class="w-full mb-2"
    @change="updateData({ description: $event })"
  />
  <ui-input
    :model-value="data.selector"
    placeholder="Element selector"
    class="mb-1 w-full"
    @change="updateData({ selector: $event })"
  />
  <ui-checkbox
    :model-value="data.multiple"
    @change="updateData({ multiple: $event })"
  >
    Multiple
  </ui-checkbox>
  <slot></slot>
</template>
<script setup>
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data', 'change']);

function updateData(value) {
  const payload = { ...props.data, ...value };

  emit('update:data', payload);
  emit('change', payload);
}
</script>

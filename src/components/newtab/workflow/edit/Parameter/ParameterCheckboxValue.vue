<template>
  <ui-checkbox
    :model-value="Boolean(modelValue)"
    type="text"
    class="w-full"
    :placeholder="paramData.placeholder"
    @change="$emit('update:modelValue', $event)"
  >
    {{ paramData.placeholder || paramData.name }}
  </ui-checkbox>
</template>
<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  paramData: {
    type: Object,
    default: () => ({}),
  },
  editor: Boolean,
});
defineEmits(['update:modelValue']);
</script>

<template>
  <label>
    <span v-if="!editor" class="text-gray-600 dark:text-gray-200 text-sm ml-1">
      {{ paramData.name }}
    </span>
    <ui-textarea
      :model-value="modelValue"
      type="text"
      class="w-full"
      :placeholder="paramData.placeholder"
      @change="$emit('update:modelValue', $event)"
    />
  </label>
</template>
<script setup>
defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  paramData: {
    type: Object,
    default: () => ({}),
  },
  editor: Boolean,
});
defineEmits(['update:modelValue']);
</script>

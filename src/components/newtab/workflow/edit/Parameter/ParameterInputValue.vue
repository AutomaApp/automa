<template>
  <ui-input
    :model-value="modelValue"
    :mask="mask"
    type="text"
    class="w-full"
    :placeholder="paramData.placeholder"
    @change="$emit('update:modelValue', $event)"
    @keyup.enter="$emit('execute')"
  />
</template>
<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  paramData: {
    type: Object,
    default: () => ({}),
  },
});
defineEmits(['update:modelValue', 'execute']);

const mask = computed(() => {
  const options = props.paramData.data;
  if (!options || !options.useMask) return null;

  const masks = options.masks.map((item) => {
    const cloneMask = { ...item };
    if (cloneMask.isRegex) cloneMask.mask = new RegExp(cloneMask.mask);
    else cloneMask.mask = cloneMask.mask.replaceAll('!', '\\');

    delete cloneMask.isRegex;

    return cloneMask;
  });

  if (masks.length === 1) return masks[0];

  return {
    mask: masks,
  };
});
</script>

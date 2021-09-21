<template>
  <slot></slot>
</template>
<script setup>
import { toRefs, provide } from 'vue';

/* eslint-disable-next-line */
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
});

provide('ui-tab-panels', toRefs(props));
</script>

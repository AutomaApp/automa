<template>
  <div
    v-if="value === uiTabPanels.modelValue.value"
    class="ui-tab-panel"
    :class="activeClass"
  >
    <slot></slot>
  </div>
</template>
<script setup>
import { inject } from 'vue';

/* eslint-disable-next-line */
defineProps({
  value: {
    type: [String, Number],
    default: '',
  },
  activeClass: {
    type: String,
    default: 'ui-tab-panel--active',
  },
});

const uiTabPanels = inject('ui-tab-panels', {});
</script>

<template>
  <button
    :aria-selected="uiTabs.modelValue.value === value"
    :class="[
      uiTabs.modelValue.value === value
        ? 'border-accent'
        : 'border-transparent',
      { 'flex-1': uiTabs.fill.value },
    ]"
    :tabIndex="uiTabs.modelValue.value === value ? 0 : -1"
    aria-role="tab"
    class="border-b-2 px-2 z-[1] py-3 ui-tab focus:ring-0"
    @mouseenter="uiTabs.hoverHandler"
    @click="uiTabs.updateActive(value)"
  >
    <slot></slot>
  </button>
</template>
<script setup>
import { inject } from 'vue';

/* eslint-disable-next-line */
const props = defineProps({
  value: {
    type: [String, Number],
    default: '',
  },
});

const uiTabs = inject('ui-tabs', {});
</script>
